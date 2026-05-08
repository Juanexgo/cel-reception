"use server";

import { revalidatePath } from "next/cache";

import { userCreateSchema, userUpdateSchema } from "@/lib/validations";
import {
  countActiveAdmins,
  createUserService,
  getAllUsers,
  getUserById,
  updateUserService,
} from "@/repositories/user-repository";
import { requireAdmin, requireUser } from "@/lib/auth/require-user";
import {
  conflict,
  forbidden,
  notFound,
  ok,
  safeAction,
  validationFail,
  type ActionResult,
} from "@/lib/security/action-response";

export async function getUsersAction() {
  await requireUser();
  return getAllUsers();
}

export async function createUserAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("createUser", async () => {
    await requireAdmin();

    const parsed = userCreateSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    try {
      await createUserService(parsed.data);
      revalidatePath("/users");
      return ok("Usuario creado");
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        return conflict("Ya existe un usuario con ese email");
      }
      throw err;
    }
  });
}

export async function updateUserAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return safeAction("updateUser", async () => {
    await requireAdmin();

    const rawPassword = formData.get("password");
    const password =
      typeof rawPassword === "string" && rawPassword.length > 0
        ? rawPassword
        : undefined;

    const parsed = userUpdateSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      isActive: formData.get("isActive") === "true",
      password,
    });
    if (!parsed.success) return validationFail(parsed.error);

    const target = await getUserById(parsed.data.id);
    if (!target) return notFound("Usuario no encontrado");

    // Guard against losing the last active admin via demotion or deactivation.
    const wouldDropAdmin =
      target.role === "ADMIN" &&
      target.isActive &&
      (parsed.data.role !== "ADMIN" || !parsed.data.isActive);

    if (wouldDropAdmin) {
      const remaining = await countActiveAdmins(target.id);
      if (remaining === 0) {
        return forbidden(
          "No se puede modificar al último administrador activo. Promueve a otro usuario primero."
        );
      }
    }

    try {
      await updateUserService(parsed.data);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        return conflict("Ya existe un usuario con ese email");
      }
      throw err;
    }

    revalidatePath("/users");
    return ok("Usuario actualizado");
  });
}
