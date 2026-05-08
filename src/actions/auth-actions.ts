"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/lib/validations";
import { getUserByEmail, verifyPassword } from "@/repositories/user-repository";
import { createSession, logout } from "@/lib/auth";
import {
  fail,
  ok,
  safeAction,
  validationFail,
  type ActionResult,
} from "@/lib/security/action-response";

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Validation + credential check happen inside safeAction so anything that
  // blows up (DB outage, bcrypt failure) becomes a controlled SERVER_ERROR
  // instead of leaking a stack trace to the login page.
  const result = await safeAction<{ ready: true }>("login", async () => {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) return validationFail(parsed.error);

    const user = await getUserByEmail(parsed.data.email);
    if (!user) {
      // Generic message — never confirm whether the email exists.
      return fail("Credenciales inválidas", "UNAUTHORIZED");
    }
    const valid = await verifyPassword(user, parsed.data.password);
    if (!valid) return fail("Credenciales inválidas", "UNAUTHORIZED");
    if (!user.isActive) return fail("Usuario desactivado", "FORBIDDEN");

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return ok("Sesión iniciada", { ready: true });
  });

  if (!result.success) return result;
  // redirect() must run outside the safeAction wrapper so its NEXT_REDIRECT
  // sentinel propagates up to Next.js.
  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
