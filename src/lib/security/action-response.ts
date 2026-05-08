import type { ZodError } from "zod";
import { UnauthorizedError, isAuthError } from "@/lib/auth/errors";

/**
 * Uniform return type for all Server Actions.
 *
 * Two reasons we converged on this shape:
 *  1. The frontend can branch on `success` instead of doing string-y
 *     error checks like `"error" in state`.
 *  2. We can attach Zod field errors verbatim, so forms can render
 *     per-field hints without us re-implementing error mapping.
 *
 * Server Actions MUST NOT throw raw errors from Prisma, the SMS provider,
 * or anywhere else — that would leak internal details to the client.
 * Use the helpers below to construct controlled responses.
 */
export interface ActionSuccess<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ActionFailure {
  success: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
  /** Coarse code for the client UI (e.g. "UNAUTHORIZED", "VALIDATION"). */
  code?: ActionErrorCode;
}

export type ActionResult<T = unknown> = ActionSuccess<T> | ActionFailure;

export type ActionErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export function ok<T>(message: string, data?: T): ActionSuccess<T> {
  return { success: true, message, data };
}

export function fail(
  message: string,
  code: ActionErrorCode = "SERVER_ERROR"
): ActionFailure {
  return { success: false, message, code };
}

export function validationFail(error: ZodError): ActionFailure {
  // z.flatten() returns string[] per field; we narrow it explicitly so the
  // ActionFailure shape stays exact and doesn't infer `unknown`.
  const flat = error.flatten() as {
    formErrors: string[];
    fieldErrors: Record<string, string[] | undefined>;
  };
  const firstFieldError = Object.values(flat.fieldErrors).find(
    (arr): arr is string[] => Array.isArray(arr) && arr.length > 0
  );
  const message = flat.formErrors[0] ?? firstFieldError?.[0] ?? "Datos inválidos";
  // Drop undefined entries so the public shape is `Record<string, string[]>`.
  const fieldErrors: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flat.fieldErrors)) {
    if (v && v.length > 0) fieldErrors[k] = v;
  }
  return {
    success: false,
    message,
    fieldErrors,
    code: "VALIDATION",
  };
}

export const unauthorized = (
  message = "Inicia sesión para continuar"
): ActionFailure => ({
  success: false,
  message,
  code: "UNAUTHORIZED",
});

export const forbidden = (
  message = "No tienes permiso para esta acción"
): ActionFailure => ({
  success: false,
  message,
  code: "FORBIDDEN",
});

export const notFound = (
  message = "Recurso no encontrado"
): ActionFailure => ({
  success: false,
  message,
  code: "NOT_FOUND",
});

export const conflict = (message: string): ActionFailure => ({
  success: false,
  message,
  code: "CONFLICT",
});

/**
 * Catch-all wrapper. Use for the "I don't know what blew up" branch of an
 * action. Logs the technical error server-side and returns a generic
 * message to the client. NEVER include `err.message` in the response.
 */
export function serverError(
  err: unknown,
  context: string,
  publicMessage = "Ocurrió un error inesperado. Inténtalo de nuevo."
): ActionFailure {
  const detail =
    err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(`[action] ${context}:`, detail);
  return { success: false, message: publicMessage, code: "SERVER_ERROR" };
}

/**
 * Type guard for callers that want to discriminate cleanly.
 *
 *   if (isFailure(result)) { /* handle * / }
 */
export function isFailure(result: ActionResult): result is ActionFailure {
  return result.success === false;
}

export function isSuccess<T>(
  result: ActionResult<T>
): result is ActionSuccess<T> {
  return result.success === true;
}

/**
 * Wraps an action body so that:
 *  - UnauthorizedError → unauthorized() response
 *  - ForbiddenError    → forbidden() response
 *  - NEXT_REDIRECT     → re-thrown (Next.js relies on this control-flow)
 *  - everything else   → serverError() (logged server-side, generic msg)
 *
 * The Server Action calls `safeAction("createReception", async () => { ... })`
 * and never has to worry about a Prisma stack trace reaching the client.
 */
export async function safeAction<T>(
  context: string,
  body: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (err) {
    // Next.js uses thrown sentinel objects (NEXT_REDIRECT, NEXT_NOT_FOUND)
    // for navigation. We must let those propagate or the redirect breaks.
    if (isNextControlFlow(err)) throw err;

    if (isAuthError(err)) {
      return err instanceof UnauthorizedError
        ? unauthorized(err.message)
        : forbidden(err.message);
    }
    return serverError(err, context) as ActionFailure;
  }
}

/**
 * Detect the framework's internal sentinels so we don't accidentally
 * swallow `redirect()` or `notFound()` calls inside our wrappers.
 */
function isNextControlFlow(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest = (err as { digest?: unknown }).digest;
  if (typeof digest === "string") {
    return (
      digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
    );
  }
  return false;
}
