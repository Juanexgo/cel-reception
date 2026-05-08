-- Adds an atomic, sequence-backed numeric ID for receptions and rewrites the
-- visible folio so it grows without a fixed digit cap.
--
-- Before:  folio = "REC-000001" (zero-padded, computed by counting rows)
-- After:   folioNumber = 1, folio = "REC-1" (Postgres sequence guarantees uniqueness)
--
-- This migration is idempotent: re-running it on a DB where the column already
-- exists is a no-op for the column itself, but the sequence and folio rewrite
-- steps still run safely.

BEGIN;

-- 1) Add the column as nullable so we can backfill existing rows first.
ALTER TABLE "Reception" ADD COLUMN IF NOT EXISTS "folioNumber" INTEGER;

-- 2) Backfill folioNumber from the existing folio string ("REC-00010" -> 10).
--    Anything that doesn't match becomes NULL and is filled below from a fresh
--    sequence call so we never end up with NULLs after the migration.
UPDATE "Reception"
SET "folioNumber" = NULLIF(regexp_replace("folio", '^REC-0*', ''), '')::INTEGER
WHERE "folioNumber" IS NULL;

-- 3) Create the sequence Prisma's `@default(autoincrement())` will use.
CREATE SEQUENCE IF NOT EXISTS "Reception_folioNumber_seq";

-- 4) Reserve the sequence so its next value is `MAX(folioNumber) + 1` (or 1
--    if the table is empty). The `false` flag means "don't mark as used".
SELECT setval(
  '"Reception_folioNumber_seq"',
  GREATEST(COALESCE((SELECT MAX("folioNumber") FROM "Reception"), 0), 0) + 1,
  false
);

-- 5) Fill any leftover NULLs (rows whose folio didn't match REC-N).
UPDATE "Reception"
SET "folioNumber" = nextval('"Reception_folioNumber_seq"'::regclass)
WHERE "folioNumber" IS NULL;

-- 6) Lock the column down: NOT NULL + unique + default to nextval().
ALTER TABLE "Reception" ALTER COLUMN "folioNumber" SET NOT NULL;
ALTER TABLE "Reception"
  ALTER COLUMN "folioNumber" SET DEFAULT nextval('"Reception_folioNumber_seq"'::regclass);

-- Tie the sequence to the column so dropping the column also drops the sequence.
ALTER SEQUENCE "Reception_folioNumber_seq" OWNED BY "Reception"."folioNumber";

-- Unique index (Prisma's @unique).
CREATE UNIQUE INDEX IF NOT EXISTS "Reception_folioNumber_key"
  ON "Reception"("folioNumber");

-- 7) Rewrite folio strings to drop padding (REC-000001 -> REC-1). The unique
--    constraint on `folio` still holds because we derive each value from the
--    already-unique folioNumber.
UPDATE "Reception" SET "folio" = 'REC-' || "folioNumber"::text;

COMMIT;
