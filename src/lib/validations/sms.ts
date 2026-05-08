import { z } from "zod";
import { phoneSchema } from "./common";

/**
 * SMS payload validator.
 *
 * - `to` is normalized into digits-only via phoneSchema.
 * - `body` must fit two SMS segments (~320 GSM-7 chars). Anything longer
 *   would cost more than expected and risks getting truncated by carriers.
 * - We forbid newline-rich payloads typical of injected templates.
 *
 * IMPORTANT: callers MUST NOT include sensitive info (IMEI, problem
 * description, signature, internal IDs, prices). The schema does not
 * try to detect every leak — keep payloads minimal at the call site.
 */
export const smsPayloadSchema = z.object({
  to: phoneSchema,
  body: z
    .string()
    .trim()
    .min(1, "Mensaje vacío")
    .max(320, "Mensaje demasiado largo (máximo 320 caracteres)"),
});

export type SmsPayload = z.infer<typeof smsPayloadSchema>;
