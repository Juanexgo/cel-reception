/**
 * Re-export point for admin-only guard. Kept as its own file because some
 * actions only need this single helper and importing the whole module
 * with all role helpers would be noisy.
 */
export { requireAdmin } from "./require-user";
