import { z } from "zod";
import {
  brandEnum,
  cuidSchema,
  emptyToUndefined,
  imeiSchema,
  LONG_TEXT_MAX,
  moneySchema,
  paymentMethodEnum,
  positiveMoneySchema,
  receptionStatusEnum,
  searchQuerySchema,
  SHORT_TEXT_MAX,
  signatureDataUrlSchema,
} from "./common";

/**
 * Schema for the `Crear Recepción` form.
 *
 * - clientId is mandatory (the form forces a selection).
 * - technicianId is optional and may arrive as the literal string "none".
 * - imei may be empty or absent; only validated when provided.
 * - accessories defaults to "Ninguno" so we always store a non-null string.
 */
export const createReceptionSchema = z.object({
  clientId: cuidSchema,
  technicianId: emptyToUndefined(cuidSchema),
  brand: brandEnum,
  model: z
    .string()
    .trim()
    .min(1, "El modelo es requerido")
    .max(SHORT_TEXT_MAX, "Modelo demasiado largo"),
  color: z
    .string()
    .trim()
    .min(1, "El color es requerido")
    .max(SHORT_TEXT_MAX, "Color demasiado largo"),
  imei: emptyToUndefined(imeiSchema),
  problem: z
    .string()
    .trim()
    .min(5, "Describa el problema (mínimo 5 caracteres)")
    .max(LONG_TEXT_MAX, "Descripción demasiado larga"),
  accessories: z.preprocess(
    (v) => {
      if (typeof v !== "string") return "Ninguno";
      const trimmed = v.trim();
      return trimmed === "" ? "Ninguno" : trimmed;
    },
    z.string().max(SHORT_TEXT_MAX, "Accesorios demasiado largo")
  ),
  totalCost: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? 0 : v),
    moneySchema
  ),
});
export type CreateReceptionInput = z.infer<typeof createReceptionSchema>;

/**
 * Update schema. All fields are optional individually but at least one
 * must change. We also include the receptionId so the action can locate
 * the row server-side without trusting other inputs.
 */
export const updateReceptionSchema = z
  .object({
    receptionId: cuidSchema,
    technicianId: emptyToUndefined(cuidSchema),
    brand: brandEnum.optional(),
    model: z.string().trim().min(1).max(SHORT_TEXT_MAX).optional(),
    color: z.string().trim().min(1).max(SHORT_TEXT_MAX).optional(),
    imei: emptyToUndefined(imeiSchema),
    problem: z.string().trim().min(5).max(LONG_TEXT_MAX).optional(),
    accessories: z.string().trim().max(SHORT_TEXT_MAX).optional(),
    totalCost: moneySchema.optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).some(
        (k) => k !== "receptionId" && data[k as keyof typeof data] !== undefined
      ),
    { message: "No hay cambios para aplicar" }
  );
export type UpdateReceptionInput = z.infer<typeof updateReceptionSchema>;

export const updateReceptionStatusSchema = z.object({
  receptionId: cuidSchema,
  status: receptionStatusEnum,
  notes: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(LONG_TEXT_MAX, "Notas demasiado largas").optional()
  ),
});
export type UpdateReceptionStatusInput = z.infer<
  typeof updateReceptionStatusSchema
>;

/**
 * Deliver schema — used by the dedicated delivery action. The signature is
 * required and the action atomically transitions the reception to DELIVERED.
 */
export const deliverReceptionSchema = z.object({
  receptionId: cuidSchema,
  signatureData: signatureDataUrlSchema,
  notes: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(LONG_TEXT_MAX).optional()
  ),
});
export type DeliverReceptionInput = z.infer<typeof deliverReceptionSchema>;

/** Internal search filters (folio / phone / client name). */
export const searchReceptionsSchema = z.object({
  search: searchQuerySchema.optional().default(""),
  status: receptionStatusEnum.or(z.literal("ALL")).optional().default("ALL"),
});
export type SearchReceptionsInput = z.infer<typeof searchReceptionsSchema>;

/** Saved on its own (legacy entry point). */
export const signatureSchema = z.object({
  receptionId: cuidSchema,
  signatureData: signatureDataUrlSchema,
});
export type SignatureInput = z.infer<typeof signatureSchema>;

export const paymentSchema = z.object({
  receptionId: cuidSchema,
  amount: positiveMoneySchema,
  method: paymentMethodEnum,
  concept: z
    .string()
    .trim()
    .min(1, "El concepto es requerido")
    .max(SHORT_TEXT_MAX, "Concepto demasiado largo"),
  reference: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(SHORT_TEXT_MAX).optional()
  ),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

/**
 * Allowed status transitions. We leave RECEIVED open to most states, but
 * disallow returning to RECEIVED and disallow any change after DELIVERED
 * or CANCELLED — these are terminal states.
 *
 * The `from` and `to` are validated by the action; on disallowed
 * transitions we surface a friendly error rather than corrupting state.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  z.infer<typeof receptionStatusEnum>,
  ReadonlyArray<z.infer<typeof receptionStatusEnum>>
> = {
  RECEIVED: ["DIAGNOSING", "WAITING_PARTS", "REPAIRING", "READY", "CANCELLED"],
  DIAGNOSING: ["WAITING_PARTS", "REPAIRING", "READY", "CANCELLED"],
  WAITING_PARTS: ["DIAGNOSING", "REPAIRING", "READY", "CANCELLED"],
  REPAIRING: ["WAITING_PARTS", "READY", "CANCELLED"],
  READY: ["DELIVERED", "REPAIRING", "CANCELLED"],
  DELIVERED: [], // terminal
  CANCELLED: [], // terminal
};

export function isAllowedStatusTransition(
  from: z.infer<typeof receptionStatusEnum>,
  to: z.infer<typeof receptionStatusEnum>
): boolean {
  if (from === to) return true; // idempotent re-saves are fine
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
