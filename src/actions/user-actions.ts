"use server";

import { userSchema } from "@/schemas";
import { getAllUsers, createUserService } from "@/repositories/user-repository";
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
