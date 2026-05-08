import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditAction } from "../../generated/prisma/client";

/**
 * Snapshot of the actor performing a mutation. We store both the FK and the
 * name/email at the moment of the action so the trail still renders even if
 * the user is deleted later.
 */
export interface AuditActor {
  /** User FK; pass `null` for system actions (scripts, seeding). */
  id: string | null;
  name: string;
  email: string;
}

/**
 * Per-action metadata shapes. We keep them small and JSON-friendly — the
 * audit log is meant to be readable, not to substitute event-sourcing.
 *
 * The reception-centric kinds (CREATE/UPDATE/STATUS_CHANGE/DELIVER/DELETE)
 * are scoped via a `receptionId`; client-centric ones (DELETE_CLIENT) carry
 * a `clientId`. The `recordAudit` helper picks the right column.
 */
export type AuditMetadata =
  | { kind: "CREATE"; folio: string; brand: string; model: string }
  | {
      kind: "UPDATE";
      changedFields: string[];
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    }
  | { kind: "STATUS_CHANGE"; from: string; to: string; notes?: string }
  | { kind: "DELIVER"; notes?: string }
  | { kind: "DELETE" }
  | { kind: "DELETE_CLIENT"; clientName: string; phone?: string };

/**
 * Map between the internal `kind` discriminator and the DB enum. Keeps the
 * call sites readable and lets TypeScript narrow the metadata shape.
 */
const ACTION_BY_KIND: Record<AuditMetadata["kind"], AuditAction> = {
  CREATE: AuditAction.CREATE,
  UPDATE: AuditAction.UPDATE,
  STATUS_CHANGE: AuditAction.STATUS_CHANGE,
  DELIVER: AuditAction.DELIVER,
  DELETE: AuditAction.DELETE,
  DELETE_CLIENT: AuditAction.DELETE_CLIENT,
};

/**
 * Insert an audit row. Always pass the same `tx` you used for the parent
 * mutation so the audit write is atomic with it — a crash mid-write should
 * either persist BOTH the change and the audit entry, or NEITHER.
 *
 * Provide exactly one target: `receptionId` for reception events,
 * `clientId` for client-level events.
 */
export async function recordAudit(
  tx: Prisma.TransactionClient | typeof prisma,
  args: {
    receptionId?: string;
    clientId?: string;
    actor: AuditActor;
    metadata: AuditMetadata;
  }
) {
  const { receptionId, clientId, actor, metadata } = args;
  if (!receptionId && !clientId) {
    throw new Error("recordAudit requires either receptionId or clientId");
  }
  return tx.auditLog.create({
    data: {
      receptionId: receptionId ?? null,
      clientId: clientId ?? null,
      userId: actor.id,
      userName: actor.name,
      userEmail: actor.email,
      action: ACTION_BY_KIND[metadata.kind],
      // Drop the discriminator from the persisted JSON — `action` already
      // tells us what shape this row has.
      metadata: stripKind(metadata),
    },
  });
}

function stripKind(meta: AuditMetadata): Prisma.InputJsonValue | undefined {
  // Build a shallow copy without `kind` to keep the JSON column tidy.
  const { kind: _kind, ...rest } = meta as { kind: string } & Record<string, unknown>;
  void _kind;
  // Empty objects make for noisier reads — collapse them to null.
  return Object.keys(rest).length === 0 ? undefined : (rest as Prisma.InputJsonValue);
}

export async function getAuditLog(receptionId: string) {
  return prisma.auditLog.findMany({
    where: { receptionId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      userId: true,
      userName: true,
      userEmail: true,
      metadata: true,
      createdAt: true,
    },
  });
}

export type AuditLogEntry = Awaited<ReturnType<typeof getAuditLog>>[number];
