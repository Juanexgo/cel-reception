-- Adds AuditLog: append-only history of who created/edited/changed-status/
-- delivered/deleted each reception.
--
-- Userid is ON DELETE SET NULL so removing a user account doesn't erase the
-- trail; the snapshot of name + email is kept inline for offline rendering.

BEGIN;

CREATE TYPE "AuditAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'STATUS_CHANGE',
  'DELIVER',
  'DELETE'
);

CREATE TABLE "AuditLog" (
  "id"          TEXT          NOT NULL,
  "receptionId" TEXT          NOT NULL,
  "userId"      TEXT,
  "userName"    TEXT          NOT NULL,
  "userEmail"   TEXT          NOT NULL,
  "action"      "AuditAction" NOT NULL,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_receptionId_fkey"
  FOREIGN KEY ("receptionId") REFERENCES "Reception"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_receptionId_createdAt_idx"
  ON "AuditLog"("receptionId", "createdAt");

COMMIT;
