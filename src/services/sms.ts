import { smsPayloadSchema, type SmsPayload } from "@/lib/validations";

/**
 * Thin SMS wrapper.
 *
 * Security & reliability rules:
 * - Validates the payload with Zod before doing anything else. The phone is
 *   normalized to digits-only and the body is capped at 320 chars (2 GSM-7
 *   segments) so we never accidentally trigger long-message billing.
 * - Never include sensitive data (IMEI, addresses, signatures, prices). The
 *   helper functions below intentionally compose only public-safe content.
 * - Never throws — failures are logged server-side and return `false` so the
 *   caller can decide whether to surface the error.
 */
export async function sendSMS(message: SmsPayload): Promise<boolean> {
  const parsed = smsPayloadSchema.safeParse(message);
  if (!parsed.success) {
    console.error("[sms] invalid payload:", parsed.error.flatten());
    return false;
  }
  const { to, body } = parsed.data;

  // Mock mode: surface the message in the server log without ever sending.
  if (!process.env.SMS_PROVIDER_API_KEY) {
    console.log(`[sms:mock] to=${to} body=${JSON.stringify(body)}`);
    return true;
  }

  try {
    // Real provider integration goes here. Example with Twilio:
    //   const client = require('twilio')(
    //     process.env.TWILIO_ACCOUNT_SID,
    //     process.env.TWILIO_AUTH_TOKEN,
    //   );
    //   await client.messages.create({
    //     body, from: process.env.TWILIO_PHONE_NUMBER, to,
    //   });
    return true;
  } catch (error) {
    console.error("[sms] provider error:", error);
    return false;
  }
}

/**
 * Build the "ready for pickup" SMS body. The folio + a short device label
 * is enough for the customer to identify their order; we never include
 * IMEI, problem description, or pricing.
 */
export async function notifyReadyForPickup(
  phone: string,
  folio: string,
  deviceLabel: string
): Promise<boolean> {
  // Hard cap on the device label so a long model name can't blow the
  // 320-char body limit.
  const safeDevice =
    deviceLabel.length > 60 ? `${deviceLabel.slice(0, 59)}…` : deviceLabel;
  const body = `Centro de Servicio Multimarcas: tu equipo ${safeDevice} (${folio}) está listo para recoger.`;
  return sendSMS({ to: phone, body });
}
