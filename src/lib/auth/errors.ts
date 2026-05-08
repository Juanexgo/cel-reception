/**
 * Stand-alone error classes so any module (including session helpers) can
 * import them without creating a cycle. The action-response layer recognizes
 * these sentinel errors and converts them into UNAUTHORIZED / FORBIDDEN
 * responses instead of logging them as generic server errors.
 */

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED" as const;
  constructor(message = "Inicia sesión para continuar") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN" as const;
  constructor(message = "No tienes permiso para esta acción") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function isAuthError(
  err: unknown
): err is UnauthorizedError | ForbiddenError {
  return err instanceof UnauthorizedError || err instanceof ForbiddenError;
}
