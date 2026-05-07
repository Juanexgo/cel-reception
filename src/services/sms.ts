export interface SMSMessage {
  to: string;
  body: string;
}

export async function sendSMS(message: SMSMessage): Promise<boolean> {
  console.log("[SMS MOCK] Would send to:", message.to);
  console.log("[SMS MOCK] Message:", message.body);

  if (process.env.SMS_PROVIDER_API_KEY) {
    try {
      // Add real SMS provider integration here
      // Example with Twilio:
      // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({ body: message.body, from: process.env.TWILIO_PHONE_NUMBER, to: message.to });
      return true;
    } catch (error) {
      console.error("[SMS] Failed to send:", error);
      return false;
    }
  }

  return true;
}

export async function notifyReadyForPickup(phone: string, folio: string, device: string) {
  return sendSMS({
    to: phone,
    body: `Centro de Servicio Multimarcas: Su dispositivo ${device} (${folio}) está listo para recoger.`,
  });
}
