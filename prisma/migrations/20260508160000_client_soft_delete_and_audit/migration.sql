-- Adds soft-delete to Client and extends AuditLog so it can record
-- client-level events (DELETE_CLIENT) in addition to per-reception ones.
--
-- Postgres requires `ALTER TYPE ... ADD VALUE` to run outside a transaction
-- block. We split the work into a leading enum-extension statement and a
-- single transaction for the table changes.

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DELETE_CLIENT';

BEGIN;

-- 1) Soft-delete column on Client.
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Client_deletedAt_idx" ON "Client"("deletedAt");

-- 2) Make AuditLog.receptionId nullable so audit rows can be associated to
--    other entity types. Existing rows keep their values; new client-only
--    rows leave it NULL.
ALTER TABLE "AuditLog" ALTER COLUMN "receptionId" DROP NOT NULL;

-- 3) Add AuditLog.clientId column + FK + index.
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

ALTER TABLE "AuditLog"
  DROP CONSTRAINT IF EXISTS "AuditLog_clientId_fkey";

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AuditLog_clientId_createdAt_idx"
  ON "AuditLog"("clientId", "createdAt");

COMMIT;
