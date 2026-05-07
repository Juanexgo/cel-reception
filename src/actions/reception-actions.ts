"use server";

import { receptionSchema, statusUpdateSchema, signatureSchema } from "@/schemas";
import {
  createReception,
  getAllReceptions,
  getReceptionById,
  getReceptionByTrackingToken,
  updateReceptionStatus,
  saveSignature,
  getReceptionStats,
  getTechnicians,
} from "@/repositories/reception-repository";
import { notifyReadyForPickup } from "@/services/sms";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export async function createReceptionAction(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const validated = receptionSchema.safeParse({
    clientId: formData.get("clientId"),
    technicianId: formData.get("technicianId"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    color: formData.get("color"),
    imei: formData.get("imei"),
    problem: formData.get("problem"),
    accessories: formData.get("accessories"),
    totalCost: formData.get("totalCost"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  // The technicianId hidden field carries the literal "none" when no technician
  // is assigned (Base UI Select disallows empty-string values).
  const data = {
    ...validated.data,
    technicianId:
      validated.data.technicianId && validated.data.technicianId !== "none"
        ? validated.data.technicianId
        : undefined,
  };

  let reception;
  try {
    reception = await createReception(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear la recepción";
    return { error: message };
  }

  // redirect() throws NEXT_REDIRECT — must be outside try/catch so it propagates.
  revalidatePath("/dashboard");
  revalidatePath("/receptions");
  redirect(`/receptions/${reception.id}`);
}

export async function getReceptionsAction(search?: string, statusFilter?: string) {
  await requireAuth();
  return getAllReceptions(search, statusFilter);
}

export async function getReceptionAction(id: string) {
  await requireAuth();
  return getReceptionById(id);
}

export async function updateStatusAction(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const validated = statusUpdateSchema.safeParse({
    receptionId: formData.get("receptionId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  const reception = await getReceptionById(validated.data.receptionId);
  if (!reception) return { error: "Recepción no encontrada" };

  try {
    await updateReceptionStatus(validated.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar estado";
    return { error: message };
  }

  // Best-effort SMS notification — never fail the status update if SMS errors.
  if (validated.data.status === "READY" && reception.client.phone) {
    try {
      await notifyReadyForPickup(
        reception.client.phone,
        reception.folio,
        `${reception.brand} ${reception.model}`
      );
    } catch (smsError) {
      console.error("[SMS] notify failed (non-fatal):", smsError);
    }
  }

  revalidatePath(`/receptions/${validated.data.receptionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/receptions");
  return { success: true };
}

export async function saveSignatureAction(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const validated = signatureSchema.safeParse({
    receptionId: formData.get("receptionId"),
    signatureData: formData.get("signatureData"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  await saveSignature(validated.data);
  revalidatePath(`/receptions/${validated.data.receptionId}`);
  return { success: true };
}

export async function getDashboardStatsAction() {
  await requireAuth();
  return getReceptionStats();
}

export async function getTechniciansAction() {
  await requireAuth();
  return getTechnicians();
}

export async function getPublicTrackingAction(token: string) {
  return getReceptionByTrackingToken(token);
}
