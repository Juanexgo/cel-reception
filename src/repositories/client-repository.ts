import { prisma } from "@/lib/prisma";
import { recordAudit, type AuditActor } from "./audit-repository";

/**
 * Soft-deleted clients are filtered out of every list/lookup. Receptions
 * that reference a soft-deleted client keep working — the FK still points
 * at a valid row, so historical orders, audit logs and the public tracking
 * page continue to render correctly.
 */
const NOT_DELETED = { deletedAt: null };

export async function getAllClients() {
  return prisma.client.findMany({
    where: NOT_DELETED,
    orderBy: { createdAt: "desc" },
    // Only count non-deleted receptions so the counter matches the lists.
    include: {
      _count: {
        select: { receptions: { where: { deletedAt: null } } },
      },
    },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findFirst({
    where: { id, ...NOT_DELETED },
    include: {
      receptions: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { technician: { select: { name: true } } },
      },
    },
  });
}

/**
 * Internal helper used by the delete action. Bypasses the soft-delete filter
 * so we can read the row even mid-deletion.
 */
export async function getClientByIdRaw(id: string) {
  return prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      deletedAt: true,
      _count: {
        select: { receptions: { where: { deletedAt: null } } },
      },
    },
  });
}

export async function getClientByPhone(phone: string) {
  return prisma.client.findFirst({
    where: { phone, ...NOT_DELETED },
  });
}

export async function createClient(data: {
  name: string;
  phone: string;
  email?: string;
}) {
  return prisma.client.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
    },
  });
}

export async function searchClients(query: string) {
  return prisma.client.findMany({
    where: {
      ...NOT_DELETED,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
  });
}

/**
 * Soft-delete a client and append an audit entry in a single transaction.
 *
 * The caller (the action) is responsible for blocking deletion when the
 * client has active receptions — we don't enforce that here so the function
 * stays composable. Once a row is soft-deleted, the unique constraint on
 * `phone` would block a new client with the same phone; if that becomes a
 * problem we can swap the constraint for a partial unique index later.
 */
export async function softDeleteClient(
  id: string,
  actor: AuditActor,
  snapshot: { name: string; phone: string }
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await recordAudit(tx, {
      clientId: id,
      actor,
      metadata: {
        kind: "DELETE_CLIENT",
        clientName: snapshot.name,
        phone: snapshot.phone,
      },
    });
    return updated;
  });
}
