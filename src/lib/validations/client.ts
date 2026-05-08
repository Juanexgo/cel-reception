import { z } from "zod";
import { phoneSchema, SHORT_TEXT_MAX, searchQuerySchema } from "./common";

export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(SHORT_TEXT_MAX, "Nombre demasiado largo"),
  phone: phoneSchema,
  // Email is optional. We accept literal empty string from the form and
  // collapse it to undefined so Prisma stores NULL rather than "".
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .toLowerCase()
      .email("Email inválido")
      .max(254, "Email demasiado largo")
      .optional()
  ),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const searchClientsSchema = z.object({
  query: searchQuerySchema.refine(
    (v) => v.length >= 2,
    "Escribe al menos 2 caracteres"
  ),
});

export type SearchClientsInput = z.infer<typeof searchClientsSchema>;

// Backwards-compat alias for legacy imports.
export const clientSchema = createClientSchema;
export type ClientInput = CreateClientInput;
