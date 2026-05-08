import { z } from "zod";
import { folioInputSchema, trackingTokenSchema } from "./common";

/** Single-input public lookup form (e.g. /track index page). */
export const publicTrackingSearchSchema = z.object({
  folio: folioInputSchema,
});
export type PublicTrackingSearchInput = z.infer<
  typeof publicTrackingSearchSchema
>;

export const publicTrackingTokenSchema = z.object({
  token: trackingTokenSchema,
});
export type PublicTrackingTokenInput = z.infer<
  typeof publicTrackingTokenSchema
>;
