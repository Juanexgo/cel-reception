import { getSession, type SessionUser } from "@/lib/auth";
import {
  ForbiddenError,
  UnauthorizedError,
  isAuthError,
} from "@/lib/auth/errors";

export { ForbiddenError, UnauthorizedError, isAuthError };

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export type AllowedRole = "ADMIN" | "EMPLOYEE" | "TECHNICIAN";

export async function requireRoles(
  ...roles: AllowedRole[]
): Promise<SessionUser> {
  const session = await requireUser();
  if (!roles.includes(session.role as AllowedRole)) {
    throw new ForbiddenError();
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRoles("ADMIN");
}

/**
 * Optional helper for read-only actions that need to know whether the
 * caller is authenticated but should still return data otherwise.
 */
export async function getOptionalUser(): Promise<SessionUser | null> {
  return getSession();
}
