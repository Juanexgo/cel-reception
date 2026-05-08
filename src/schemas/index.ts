/**
 * Legacy entry point. The canonical schemas now live in
 * `@/lib/validations`. This file re-exports them so older imports keep
 * working while we migrate call sites incrementally.
 */
export {
  loginSchema,
  type LoginInput,
  clientSchema,
  type ClientInput,
  createReceptionSchema as receptionSchema,
  type CreateReceptionInput as ReceptionInput,
  updateReceptionStatusSchema as statusUpdateSchema,
  type UpdateReceptionStatusInput as StatusUpdateInput,
  paymentSchema,
  type PaymentInput,
  signatureSchema,
  type SignatureInput,
  userSchema,
  type UserInput,
  userUpdateSchema,
  type UserUpdateInput,
} from "@/lib/validations";
