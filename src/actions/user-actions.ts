"use server";

import { userSchema, userUpdateSchema } from "@/schemas";
import {
  countActiveAdmins,
  createUserService,
  getAllUsers,
  getUserById,
  updateUserService,
} from "@/repositories/user-repository";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUsersAction() {
  await requireAuth();
  return getAllUsers();
}

export async function createUserAction(_prevState: unknown, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    return { error: "Solo un administrador puede crear usuarios" };
  }

  const validated = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    await createUserService(validated.data);
    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return { error: "Ya existe un usuario con ese email" };
    }
    return { error: "Error al crear el usuario" };
  }
}

export async function updateUserAction(_prevState: unknown, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    return { error: "Solo un administrador puede editar usuarios" };
  }

  const rawPassword = formData.get("password");
  const password =
    typeof rawPassword === "string" && rawPassword.length > 0
      ? rawPassword
      : undefined;

  const validated = userUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "true",
    password,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  const target = await getUserById(validated.data.id);
  if (!target) {
    return { error: "Usuario no encontrado" };
  }

  // Guard against losing the last active admin via demotion or deactivation.
  const wouldDropAdmin =
    target.role === "ADMIN" &&
    target.isActive &&
    (validated.data.role !== "ADMIN" || !validated.data.isActive);

  if (wouldDropAdmin) {
    const remaining = await countActiveAdmins(target.id);
    if (remaining === 0) {
      return {
        error:
          "No se puede modificar al último administrador activo. Promueve a otro usuario primero.",
      };
    }
  }

  try {
    await updateUserService(validated.data);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return { error: "Ya existe un usuario con ese email" };
    }
    const message = error instanceof Error ? error.message : "Error al actualizar el usuario";
    return { error: message };
  }

  revalidatePath("/users");
  return { success: true };
}
