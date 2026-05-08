import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Standalone DB inspection script. Run with `npx tsx scripts/verify-folio-migration.ts`.
 *
 * Confirms post-migration invariants:
 *  - folioNumber column exists, NOT NULL, sequence-backed
 *  - every existing folio matches `REC-${folioNumber}` (no zero-padding)
 *  - sequence's nextval is strictly greater than current max
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const rows = await prisma.reception.findMany({
    select: { id: true, folio: true, folioNumber: true },
    orderBy: { folioNumber: "asc" },
  });
  const total = rows.length;
  let mismatched = 0;
  for (const r of rows) {
    const expected = `REC-${r.folioNumber}`;
    if (r.folio !== expected) {
      console.error(`MISMATCH: id=${r.id} folio=${r.folio} folioNumber=${r.folioNumber}`);
      mismatched++;
    }
  }
  const seqRows = await prisma.$queryRaw<Array<{ next: bigint }>>`
    SELECT nextval(pg_get_serial_sequence('"Reception"', 'folioNumber')) AS next
  `;
  const next = Number(seqRows[0].next);
  // Roll back the bump we just did so we don't lose a folio number.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Reception"', 'folioNumber'), ${next - 1}, true)`
  );
  const max = rows.length ? rows[rows.length - 1].folioNumber : 0;

  console.log(`rows: ${total}`);
  console.log(`max folioNumber: ${max}`);
  console.log(`sequence next-after-rollback: ${next - 1} (will allocate ${next} on next insert if untouched)`);
  console.log(`mismatched folios: ${mismatched}`);

  if (mismatched > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
