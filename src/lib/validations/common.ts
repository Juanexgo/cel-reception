import { z } from "zod";

/**
 * Shared primitive validators used across feature schemas.
 *
 * All inputs to Server Actions go through these. We trim aggressive
 * whitespace, cap string lengths so the database never receives an
 * unbounded blob, and refuse obviously bogus payloads.
 */

/** Reasonable cap for any short user-supplied label (name, color, model). */
export const SHORT_TEXT_MAX = 120;
/** Cap for free-text fields that may include a paragraph. */
export const LONG_TEXT_MAX = 2000;
/** Cap for the public tracking token URL parameter. */
export const TRACKING_TOKEN_MAX = 64;

/**
 * Prisma's CUIDs are 25 chars (cuid v1) or 24 chars (cuid v2). We accept
 * any reasonable identifier shape but bound it tightly so URL params and
 * hidden form fields cannot be used to smuggle large payloads.
 */
export const cuidSchema = z
  .string()
  .trim()
  .min(1, "Identificador requerido")
  .max(64, "Identificador inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "Identificador inválido");

/** Enum lists kept in lockstep with the Prisma schema. */
export const brandEnum = z.enum([
  "APPLE",
  "SAMSUNG",
  "HUAWEI",
  "XIAOMI",
  "OPPO",
  "VIVO",
  "MOTOROLA",
  "LG",
  "GOOGLE",
  "ONEPLUS",
  "NOKIA",
  "SONY",
  "ZTE",
  "OTHER",
]);

export const receptionStatusEnum = z.enum([
  "RECEIVED",
  "DIAGNOSING",
  "WAITING_PARTS",
  "REPAIRING",
  "READY",
  "DELIVERED",
  "CANCELLED",
]);
export type ReceptionStatusValue = z.infer<typeof receptionStatusEnum>;

export const paymentMethodEnum = z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]);
export const userRoleEnum = z.enum(["ADMIN", "EMPLOYEE", "TECHNICIAN"]);

/**
 * Phone numbers stored in the DB. We accept Mexican-style 10 digits with
 * optional spaces, parentheses or hyphens, then normalize to digits-only.
 * Length range covers international with country code.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Teléfono inválido")
  .max(20, "Teléfono inválido")
  .regex(/^[+\d\s().-]+$/, "Teléfono inválido")
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => v.replace(/^\+/, "").length >= 7, "Teléfono inválido");

/** IMEI: 14 or 15 digits. Optional in our flow. */
export const imeiSchema = z
  .string()
  .trim()
  .regex(/^\d{14,15}$/, "IMEI inválido (14 o 15 dígitos)");

/**
 * Folio surface validator. The DB enforces uniqueness; this regex is the
 * shape clients can submit when looking up a reception by folio. We accept
 * `REC-1` through `REC-{any digits}` — no fixed digit cap.
 */
export const folioSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^REC-\d{1,12}$/, "Folio inválido (formato REC-1)");

/** Lenient form for the public folio search box (auto-prefixes REC-). */
export const folioInputSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Ingresa un folio")
  .max(20, "Folio demasiado largo")
  .transform((v) => (v.startsWith("REC-") ? v : `REC-${v.replace(/^0+/, "")}`))
  .refine((v) => /^REC-\d{1,12}$/.test(v), "Folio inválido (formato REC-1)");

/**
 * Tracking token as stored on the reception row. We use the prefix `tok_`
 * + base36 random characters, but kept open for legacy values.
 */
export const trackingTokenSchema = z
  .string()
  .trim()
  .min(8, "Token inválido")
  .max(TRACKING_TOKEN_MAX, "Token inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "Token inválido");

/**
 * Search query for receptions list (folio / phone / client name).
 * Trimmed and capped — Prisma's parameterized queries take care of
 * SQL safety, so we don't need to strip individual characters.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .max(80, "Búsqueda demasiado larga");

/**
 * Signature data URL — must be a base64 PNG/JPEG image. We bound the
 * size so a malicious client can't hammer the DB with multi-megabyte
 * blobs. ~1.5 MB ceiling fits a high-res signature with margin.
 */
export const SIGNATURE_MAX_LENGTH = 1_500_000;
export const signatureDataUrlSchema = z
  .string()
  .min(20, "La firma es requerida")
  .max(SIGNATURE_MAX_LENGTH, "La firma excede el tamaño permitido")
  .regex(
    /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/,
    "La firma no es una imagen válida"
  );

/** Money amount stored as float in DB but capped at sensible values. */
export const moneySchema = z.coerce
  .number({ error: "Monto inválido" })
  .nonnegative("Monto inválido")
  .max(10_000_000, "Monto demasiado alto");

export const positiveMoneySchema = z.coerce
  .number({ error: "Monto inválido" })
  .positive("El monto debe ser positivo")
  .max(10_000_000, "Monto demasiado alto");

/**
 * Helper: take an unknown value that may be `""`, `undefined`, `null`,
 * `"none"`, etc. and normalize it to either a non-empty string or undefined.
 * Used for optional select fields where the form submits a literal "none".
 */
export function emptyToUndefined<T extends z.ZodType>(schema: T) {
  return z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    if (trimmed === "" || trimmed === "none") return undefined;
    return trimmed;
  }, schema.optional());
}
