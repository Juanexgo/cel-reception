import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config.
 *
 * We deliberately read DATABASE_URL via raw `process.env` (with a placeholder
 * fallback) instead of Prisma's `env()` helper. Why: the helper throws when
 * the variable is absent, which breaks `prisma generate` during `postinstall`
 * on a fresh CI/CD environment where the variable hasn't been wired yet.
 *
 * The placeholder is only ever used to satisfy the schema parser — any
 * command that actually opens a connection (migrate, push, seed, runtime)
 * still needs a real URL injected via `.env` (locally) or the platform's
 * env-var settings (Vercel, etc.).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
