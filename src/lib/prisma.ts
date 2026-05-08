import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma client.
 *
 * In dev we cache the client on `globalThis` to survive HMR module reloads
 * — without that we'd leak DB connections every time a file changes.
 *
 * When you re-run `prisma generate` after editing schema.prisma, HMR
 * re-imports this file with a NEW `PrismaClient` class, but the cached
 * instance was built from the OLD class and so doesn't expose any models
 * we just added. We detect that mismatch by tracking the class identity
 * alongside the instance — if the freshly-imported class differs from the
 * one used to build the cached instance, we dispose the old one and
 * create a fresh client. This keeps `prisma.<newModel>` working without
 * having to manually restart the dev server every time the schema changes.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCtor?: typeof PrismaClient;
};

function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env before starting the app."
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}

// Stale-cache detection: if a different `PrismaClient` class is now in scope
// (because we just regenerated), the cached instance is incompatible.
if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaCtor !== PrismaClient
) {
  // Best-effort disposal so the old engine releases its DB connections.
  // Don't await — we don't want the import to block on a network round-trip.
  void globalForPrisma.prisma.$disconnect?.().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaCtor = PrismaClient;
}
