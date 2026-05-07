-- Soft-delete support for Reception
ALTER TABLE "Reception" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Reception_deletedAt_idx" ON "Reception"("deletedAt");
