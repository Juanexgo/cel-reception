"use server";

import { revalidatePath } from "next/cache";

import {
  createClientSchema,
  cuidSchema,
  searchClientsSchema,
} from "@/lib/validations";
import {
  createClient,
  getAllClients,
  getClientById,
  getClientByIdRaw,
  searchClients,
  softDeleteClient,
} from "@/repositories/client-repository";
import { requireAdmin, requireUser } from "@/lib/auth/require-user";
import type { SessionUser } from "@/lib/auth";
import type { AuditActor } from "@/repositories/audit-repository";
import {
  conflict,
  fail,
  notFound,
  ok,
  safeAction,
  validationFail,
  type ActionResult,
} from "@/lib/security/action-response";

export async function getClientsAction() {
  await requireUser();
  return getAllClients();
}

export async function getClientAction(id: string) {
  await requireUser();
  return getClientById(id);
}

export async function createClientAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ clientId: string }>> {
  return safeAction("createClient", async () => {
    await requireUser();

    const parsed = createClientSchema.safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    try {
      const client = await createClient(parsed.data);
      revalidatePath("/clients");
      return ok("Cliente creado", { clientId: client.id });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        return conflict("Ya existe un cliente con ese teléfono");
      }
      throw err;
    }
  });
}

/**
 * Search box auto-complete used by the new-reception form. We never
 * exception out on bad inputs — we just return an empty list.
 */
export async function searchClientsAction(query: string) {
  await requireUser();
  const parsed = searchClientsSchema.safeParse({ query });
  if (!parsed.success) return [];
  return searchClients(parsed.data.query);
}

/**
 * Soft-delete a client (admin-only).
 *
 * Refuses deletion when the client still has active receptions — those
 * receptions need a valid client to render correctly, and we don't want a
 * "ghost client" appearing across the app. Operators can either soft-delete
 * the receptions first or, more typically, leave the client in place.
 *
 * Logs a DELETE_CLIENT audit entry inside the same transaction that flips
 * `deletedAt`, so the trail can never disagree with the row state.
 */
export async function deleteClientAction(
  clientId: string
): Promise<ActionResult> {
  return safeAction("deleteClient", async () => {
    const session = await requireAdmin();

    const parsed = cuidSchema.safeParse(clientId);
    if (!parsed.success) return validationFail(parsed.error);

    const target = await getClientByIdRaw(parsed.data);
    if (!target || target.deletedAt) {
      return notFound("Cliente no encontrado");
    }

    if (target._count.receptions > 0) {
      // Block: a friendly, non-leaky error rather than a FK error.
      return fail(
        "No se puede eliminar este cliente porque tiene recepciones asociadas.",
        "CONFLICT"
      );
    }

    await softDeleteClient(parsed.data, actorFrom(session), {
      name: target.name,
      phone: target.phone,
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${parsed.data}`);
    return ok(`Cliente ${target.name} eliminado`);
  });
}

function actorFrom(session: SessionUser): AuditActor {
  return { id: session.id, name: session.name, email: session.email };
}
