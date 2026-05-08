"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createReceptionSchema,
  cuidSchema,
  deliverReceptionSchema,
  isAllowedStatusTransition,
  paymentSchema,
  publicTrackingSearchSchema,
  searchReceptionsSchema,
  signatureSchema,
  trackingTokenSchema,
  updateReceptionSchema,
  updateReceptionStatusSchema,
  type ReceptionStatusValue,
} from "@/lib/validations";
import {
  ok,
  fail,
  validationFail,
  notFound,
  conflict,
  safeAction,
  type ActionResult,
} from "@/lib/security/action-response";
import { requireUser, requireAdmin } from "@/lib/auth/require-user";
import type { SessionUser } from "@/lib/auth";
import type { AuditActor } from "@/repositories/audit-repository";
import { getAuditLog } from "@/repositories/audit-repository";
import {
  createPayment,
  createReception,
  deliverReception,
  getAllReceptions,
  getReceptionById,
  getReceptionByTrackingToken,
  getReceptionStats,
  getTechnicians,
  getTrackingTokenByFolio,
  saveSignature,
  softDeleteReception,
  updateReceptionFields,
  updateReceptionStatus,
} from "@/repositories/reception-repository";
import { notifyReadyForPickup } from "@/services/sms";

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/** Walk through revalidatePath calls so the caller never forgets a route. */
function revalidateReceptionRoutes(receptionId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/receptions");
  if (receptionId) revalidatePath(`/receptions/${receptionId}`);
}

/** Project a SessionUser into the minimal actor shape the audit log stores. */
function actorFrom(session: SessionUser): AuditActor {
  return { id: session.id, name: session.name, email: session.email };
}

/** Convert a Prisma error code to a friendly message for known cases. */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

// -------------------------------------------------------------------------
// READ actions
// -------------------------------------------------------------------------

/** List receptions for the dashboard table. Auth-only. */
export async function getReceptionsAction(search?: string, statusFilter?: string) {
  await requireUser();
  const parsed = searchReceptionsSchema.safeParse({ search, status: statusFilter });
  if (!parsed.success) {
    // Bad input from a logged-in user — return an empty list so the UI keeps
    // working instead of throwing into the React Server boundary.
    return [];
  }
  return getAllReceptions(parsed.data.search, parsed.data.status);
}

/** Read a single reception by id. Auth-only. */
export async function getReceptionAction(id: string) {
  await requireUser();
  return getReceptionById(id);
}

export async function getDashboardStatsAction() {
  await requireUser();
  return getReceptionStats();
}

/** Load the audit trail for a single reception. Auth-only. */
export async function getReceptionAuditLogAction(receptionId: string) {
  await requireUser();
  const parsed = cuidSchema.safeParse(receptionId);
  if (!parsed.success) return [];
  return getAuditLog(parsed.data);
}

export async function getTechniciansAction() {
  await requireUser();
  return getTechnicians();
}

// -------------------------------------------------------------------------
// CREATE
// -------------------------------------------------------------------------

export async function createReceptionAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  // We split into a "did the work succeed" phase and a "navigate" phase so
  // we can let `redirect()` throw outside the try/catch (Next.js requires
  // its sentinel error to propagate up).
  const action = await safeAction("createReception", async () => {
    const session = await requireUser();

    const parsed = createReceptionSchema.safeParse({
      clientId: formData.get("clientId"),
      technicianId: formData.get("technicianId"),
      brand: formData.get("brand"),
      model: formData.get("model"),
      color: formData.get("color"),
      imei: formData.get("imei"),
      problem: formData.get("problem"),
      accessories: formData.get("accessories"),
      totalCost: formData.get("totalCost"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    try {
      const reception = await createReception(parsed.data, actorFrom(session));
      revalidateReceptionRoutes(reception.id);
      return ok("Recepción creada correctamente", { id: reception.id });
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Folio/token race — extremely unlikely with the new sequence, but we
        // keep a friendly fallback rather than leaking the Prisma error.
        return conflict("Conflicto al generar el folio. Inténtalo de nuevo.");
      }
      throw err;
    }
  });

  if (action.success && action.data?.id) {
    redirect(`/receptions/${action.data.id}`);
  }
  return action;
}

// -------------------------------------------------------------------------
// UPDATE
// -------------------------------------------------------------------------

export async function updateReceptionAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("updateReception", async () => {
    const session = await requireUser();

    const parsed = updateReceptionSchema.safeParse({
      receptionId: formData.get("receptionId"),
      technicianId: formData.get("technicianId"),
      brand: formData.get("brand"),
      model: formData.get("model"),
      color: formData.get("color"),
      imei: formData.get("imei"),
      problem: formData.get("problem"),
      accessories: formData.get("accessories"),
      totalCost: formData.get("totalCost"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    const existing = await getReceptionById(parsed.data.receptionId);
    if (!existing) return notFound("Recepción no encontrada");

    if (existing.status === "DELIVERED" || existing.status === "CANCELLED") {
      return fail(
        "No se puede modificar una recepción ya entregada o cancelada",
        "FORBIDDEN"
      );
    }

    await updateReceptionFields(parsed.data, actorFrom(session));
    revalidateReceptionRoutes(parsed.data.receptionId);
    return ok("Recepción actualizada");
  });
}

// -------------------------------------------------------------------------
// STATUS CHANGE
// -------------------------------------------------------------------------

export async function updateStatusAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("updateStatus", async () => {
    const session = await requireUser();

    const parsed = updateReceptionStatusSchema.safeParse({
      receptionId: formData.get("receptionId"),
      status: formData.get("status"),
      notes: formData.get("notes"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    const existing = await getReceptionById(parsed.data.receptionId);
    if (!existing) return notFound("Recepción no encontrada");

    const currentStatus = existing.status as ReceptionStatusValue;
    if (!isAllowedStatusTransition(currentStatus, parsed.data.status)) {
      return fail(
        `Transición de estado no permitida (${currentStatus} → ${parsed.data.status})`,
        "FORBIDDEN"
      );
    }

    await updateReceptionStatus(parsed.data, actorFrom(session), currentStatus);

    // Best-effort SMS notification — never fail the status update if SMS errors.
    if (parsed.data.status === "READY" && existing.client.phone) {
      try {
        await notifyReadyForPickup(
          existing.client.phone,
          existing.folio,
          `${existing.brand} ${existing.model}`
        );
      } catch (smsError) {
        console.error("[reception:status] SMS notify failed (non-fatal):", smsError);
      }
    }

    revalidateReceptionRoutes(parsed.data.receptionId);
    return ok("Estado actualizado");
  });
}

// -------------------------------------------------------------------------
// SIGNATURE (legacy, kept working) and DELIVERY (new atomic flow)
// -------------------------------------------------------------------------

export async function saveSignatureAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("saveSignature", async () => {
    await requireUser();

    const parsed = signatureSchema.safeParse({
      receptionId: formData.get("receptionId"),
      signatureData: formData.get("signatureData"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    const existing = await getReceptionById(parsed.data.receptionId);
    if (!existing) return notFound("Recepción no encontrada");

    await saveSignature(parsed.data);
    revalidateReceptionRoutes(parsed.data.receptionId);
    return ok("Firma guardada");
  });
}

/**
 * Atomic delivery: validates the signature, transitions the reception to
 * DELIVERED in a single transaction, and prevents double-deliveries.
 */
export async function deliverReceptionAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("deliverReception", async () => {
    const session = await requireUser();

    const parsed = deliverReceptionSchema.safeParse({
      receptionId: formData.get("receptionId"),
      signatureData: formData.get("signatureData"),
      notes: formData.get("notes"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    const existing = await getReceptionById(parsed.data.receptionId);
    if (!existing) return notFound("Recepción no encontrada");

    if (existing.status === "DELIVERED") {
      return conflict("Esta recepción ya fue entregada");
    }
    if (existing.status === "CANCELLED") {
      return fail("No se puede entregar una recepción cancelada", "FORBIDDEN");
    }

    await deliverReception(parsed.data, actorFrom(session));
    revalidateReceptionRoutes(parsed.data.receptionId);
    return ok("Equipo entregado");
  });
}

// -------------------------------------------------------------------------
// PAYMENTS
// -------------------------------------------------------------------------

export async function createPaymentAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("createPayment", async () => {
    await requireUser();

    const parsed = paymentSchema.safeParse({
      receptionId: formData.get("receptionId"),
      amount: formData.get("amount"),
      method: formData.get("method"),
      concept: formData.get("concept"),
      reference: formData.get("reference"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    const existing = await getReceptionById(parsed.data.receptionId);
    if (!existing) return notFound("Recepción no encontrada");

    await createPayment(parsed.data);
    revalidateReceptionRoutes(parsed.data.receptionId);
    return ok("Pago registrado");
  });
}

// -------------------------------------------------------------------------
// PUBLIC TRACKING
// -------------------------------------------------------------------------

/**
 * Public read for the /track/[token] page. Validates the token shape and
 * returns ONLY the safe-to-expose fields. No auth required.
 */
export async function getPublicTrackingAction(token: string) {
  const parsed = trackingTokenSchema.safeParse(token);
  if (!parsed.success) return null;
  return getReceptionByTrackingToken(parsed.data);
}

/**
 * Public folio lookup used by the /track landing form. Returns either a
 * server-side redirect to /track/<token> (success) or an ActionResult with
 * a public-friendly error message.
 */
export async function findTrackingByFolioAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // We split the work into a "lookup" phase (wrapped by safeAction so any
  // unexpected error becomes a controlled response) and a "redirect" phase
  // outside the wrapper, since redirect() relies on a thrown sentinel that
  // safeAction must let through but Server Actions need to surface as nav.
  const lookup = await safeAction<{ token: string | null }>(
    "findTrackingByFolio",
    async () => {
      const parsed = publicTrackingSearchSchema.safeParse({
        folio: formData.get("folio"),
      });
      if (!parsed.success) return validationFail(parsed.error);

      const result = await getTrackingTokenByFolio(parsed.data.folio);
      return ok("ok", { token: result?.trackingToken ?? null });
    }
  );

  if (!lookup.success) return lookup;
  if (!lookup.data?.token) {
    // Generic message — do NOT confirm whether the folio exists or not.
    return fail("No encontramos ningún folio con esos datos", "NOT_FOUND");
  }
  redirect(`/track/${lookup.data.token}`);
}

// -------------------------------------------------------------------------
// DELETE (admin)
// -------------------------------------------------------------------------

export async function deleteReceptionAction(
  receptionId: string
): Promise<ActionResult> {
  return safeAction("deleteReception", async () => {
    const session = await requireAdmin();

    const parsed = cuidSchema.safeParse(receptionId);
    if (!parsed.success) return validationFail(parsed.error);

    const existing = await getReceptionById(parsed.data);
    if (!existing) return notFound("Recepción no encontrada");

    await softDeleteReception(parsed.data, actorFrom(session));
    revalidateReceptionRoutes(parsed.data);
    return ok(`Recepción ${existing.folio} eliminada`);
  });
}
