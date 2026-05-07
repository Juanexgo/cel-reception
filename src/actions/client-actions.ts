"use server";

import { clientSchema, paymentSchema } from "@/schemas";
import { getAllClients, getClientById, createClient, searchClients } from "@/repositories/client-repository";
import { createPayment } from "@/repositories/reception-repository";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getClientsAction() {
  await requireAuth();
  return getAllClients();
}

export async function getClientAction(id: string) {
  await requireAuth();
  return getClientById(id);
}

export async function createClientAction(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const validated = clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    const client = await createClient(validated.data);
    revalidatePath("/clients");
    return { success: true, clientId: client.id };
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return { error: "Ya existe un cliente con ese teléfono" };
    }
    return { error: "Error al crear el cliente" };
  }
}

export async function searchClientsAction(query: string) {
  await requireAuth();
  if (!query || query.length < 2) return [];
  return searchClients(query);
}

export async function createPaymentAction(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const validated = paymentSchema.safeParse({
    receptionId: formData.get("receptionId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    concept: formData.get("concept"),
    reference: formData.get("reference"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Datos inválidos" };
  }

  await createPayment(validated.data);
  revalidatePath(`/receptions/${validated.data.receptionId}`);
  return { success: true };
}
