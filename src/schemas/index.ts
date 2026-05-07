import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "Teléfono inválido"),
  email: z.string().email().optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const receptionSchema = z.object({
  clientId: z.string().min(1, "Seleccione un cliente"),
  technicianId: z.string().optional(),
  brand: z.string().min(1, "Seleccione una marca"),
  model: z.string().min(1, "El modelo es requerido"),
  color: z.string().min(1, "El color es requerido"),
  imei: z.string().optional().or(z.literal("")),
  problem: z.string().min(5, "Describa el problema (mínimo 5 caracteres)"),
  accessories: z.string().default("Ninguno"),
  totalCost: z.coerce.number().optional().default(0),
});

export type ReceptionInput = z.infer<typeof receptionSchema>;

export const statusUpdateSchema = z.object({
  receptionId: z.string(),
  status: z.enum([
    "RECEIVED",
    "DIAGNOSING",
    "WAITING_PARTS",
    "REPAIRING",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ]),
  notes: z.string().optional(),
});

export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;

export const paymentSchema = z.object({
  receptionId: z.string(),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
  concept: z.string().min(1, "El concepto es requerido"),
  reference: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const signatureSchema = z.object({
  receptionId: z.string(),
  signatureData: z.string().min(1, "La firma es requerida"),
});

export type SignatureInput = z.infer<typeof signatureSchema>;

export const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  role: z.enum(["ADMIN", "EMPLOYEE", "TECHNICIAN"]),
});

export type UserInput = z.infer<typeof userSchema>;
