import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(200, "Contraseña demasiado larga"),
});

export type LoginInput = z.infer<typeof loginSchema>;
