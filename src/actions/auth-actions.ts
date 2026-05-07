"use server";

import { loginSchema } from "@/schemas";
import { getUserByEmail, verifyPassword } from "@/repositories/user-repository";
import { createSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  const user = await getUserByEmail(validated.data.email);
  if (!user) {
    return { error: "Credenciales inválidas" };
  }

  const validPassword = await verifyPassword(user, validated.data.password);
  if (!validPassword) {
    return { error: "Credenciales inválidas" };
  }

  if (!user.isActive) {
    return { error: "Usuario desactivado" };
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // redirect() throws — must be the last statement.
  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
