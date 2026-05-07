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

  try {
    const reception = await createReception(validated.data);
    revalidatePath("/dashboard");
    revalidatePath("/receptions");
    redirect(`/receptions/${reception.id}`);
  } catch (error: any) {
    return { error: error.message || "Error al crear la recepción" };
  }
}

export async function getReceptionsAction(search?: string, statusFilter?: string) {
  await requireAuth();
  return getAllReceptions(search, statusFilter);
}

export async function getReceptionAction(id: string) {
  await requireAuth();
  return getReceptionById(id);
}

export async function updateStatusAction(prevState: any, formData: FormData) {
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

  await updateReceptionStatus(validated.data);

  if (validated.data.status === "READY" && reception.client.phone) {
    await notifyReadyForPickup(reception.client.phone, reception.folio, `${reception.brand} ${reception.model}`);
  }

  revalidatePath(`/receptions/${validated.data.receptionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/receptions");
  return { success: true };
}

export async function saveSignatureAction(prevState: any, formData: FormData) {
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
