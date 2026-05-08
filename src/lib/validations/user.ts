import { z } from "zod";
import { cuidSchema, SHORT_TEXT_MAX, userRoleEnum } from "./common";

/** Strong-ish password baseline. We don't force complex classes here so as
 * not to break existing seeded users, but we enforce a minimum length and
 * a sane upper bound to prevent denial-of-service via extreme inputs. */
const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(200, "Contraseña demasiado larga");

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(SHORT_TEXT_MAX),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(254),
  password: passwordSchema,
  role: userRoleEnum,
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  id: cuidSchema,
  name: z.string().trim().min(2).max(SHORT_TEXT_MAX),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(254),
  role: userRoleEnum,
  isActive: z.boolean(),
  password: passwordSchema.optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// Backwards-compat alias.
export const userSchema = userCreateSchema;
export type UserInput = UserCreateInput;
