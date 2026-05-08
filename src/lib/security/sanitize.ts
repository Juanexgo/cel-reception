/**
 * Tiny sanitization helpers.
 *
 * Most input cleaning happens inside the Zod schemas (.trim(), .toLowerCase(),
 * .transform()). These helpers are for the few places that handle data
 * outside the Zod boundary — e.g. server-rendered HTML attributes or
 * places we paste user input into log lines.
 */

/** Returns a trimmed string or `undefined` if the value is empty / not a string. */
export function trimToOptional(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Lowercase + trim. Useful for normalizing emails before lookup. */
export function normalizeEmail(value: unknown): string | undefined {
  const v = trimToOptional(value);
  return v ? v.toLowerCase() : undefined;
}

/** Digits-only normalization for phone numbers. Keeps a leading `+`. */
export function normalizePhone(value: unknown): string | undefined {
  const v = trimToOptional(value);
  if (!v) return undefined;
  const cleaned = v.replace(/[^\d+]/g, "");
  return cleaned.length === 0 ? undefined : cleaned;
}

/**
 * Make a string safe to drop in plain text where curly braces / angle
 * brackets could be interpreted as markup. Used only for log lines and
 * never for HTML rendering — React already escapes children automatically.
 */
export function escapePlainText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Keep a string within a max length, adding an ellipsis when truncating. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
