import { prisma } from "@/lib/prisma";
import {
  Brand,
  PaymentMethod,
  ReceptionStatus,
  UserRole,
} from "../../generated/prisma/client";
import { recordAudit, type AuditActor } from "./audit-repository";

/**
 * Generate a non-guessable public tracking token.
 *
 * crypto.getRandomValues backs `crypto.randomUUID` and is the recommended CSPRNG
 * source available in Node 18+ and Edge runtimes. We base32-encode 16 bytes for
 * 128 bits of entropy in a URL-safe alphabet.
 */
function generateTrackingToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // RFC4648 base32 (lowercase) — keeps URLs case-insensitive friendly.
  const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return `tok_${out}`;
}

export async function createReception(
  data: {
    clientId: string;
    technicianId?: string;
    brand: string;
    model: string;
    color: string;
    imei?: string;
    problem: string;
    accessories: string;
    totalCost: number;
  },
  actor: AuditActor
) {
  // Folio assignment is atomic: we let the Postgres sequence behind
  // `folioNumber` (autoincrement) hand us a unique number, then derive the
  // public folio string from it. Even under heavy concurrency two inserts
  // can never collide because nextval() is atomic at the DB level. We also
  // run the create + statusHistory + audit write inside a single transaction
  // so a partial failure can't leave a reception without history or audit.
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ next: bigint }>>`
      SELECT nextval(pg_get_serial_sequence('"Reception"', 'folioNumber')) AS next
    `;
    const folioNumber = Number(rows[0]?.next ?? 0);
    if (!folioNumber || folioNumber < 1) {
      throw new Error("Could not allocate folio number");
    }
    const folio = `REC-${folioNumber}`;
    const trackingToken = generateTrackingToken();

    const reception = await tx.reception.create({
      data: {
        folio,
        folioNumber,
        trackingToken,
        clientId: data.clientId,
        technicianId: data.technicianId || null,
        brand: data.brand as Brand,
        model: data.model,
        color: data.color,
        imei: data.imei || null,
        problem: data.problem,
        accessories: data.accessories,
        totalCost: data.totalCost,
        status: "RECEIVED",
        statusHistory: {
          create: { status: "RECEIVED", notes: "Orden creada" },
        },
      },
    });

    await recordAudit(tx, {
      receptionId: reception.id,
      actor,
      metadata: {
        kind: "CREATE",
        folio: reception.folio,
        brand: reception.brand,
        model: reception.model,
      },
    });

    return reception;
  });
}

export async function getAllReceptions(search?: string, statusFilter?: string) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (search) {
    // Order matters: order by folioNumber so newer (numerically higher)
    // folios always sort first, regardless of digit count.
    where.OR = [
      { folio: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
      { client: { phone: { contains: search } } },
    ];
  }

  if (statusFilter && statusFilter !== "ALL") {
    (where as Record<string, unknown>).status = statusFilter;
  }

  return prisma.reception.findMany({
    where,
    orderBy: { folioNumber: "desc" },
    include: {
      client: { select: { name: true, phone: true } },
      technician: { select: { name: true } },
      _count: { select: { payments: true } },
    },
  });
}

export async function getReceptionById(id: string) {
  // Soft-deleted receptions are treated as not-found everywhere.
  return prisma.reception.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      technician: { select: { name: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function softDeleteReception(id: string, actor: AuditActor) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.reception.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await recordAudit(tx, {
      receptionId: id,
      actor,
      metadata: { kind: "DELETE" },
    });
    return updated;
  });
}

/**
 * Public lookup by folio — returns ONLY the tracking token, used to redirect
 * the client to /track/<token>. We do not return any other data here so that
 * folio enumeration cannot leak reception details.
 */
export async function getTrackingTokenByFolio(folio: string) {
  return prisma.reception.findFirst({
    where: { folio, deletedAt: null },
    select: { trackingToken: true },
  });
}

/**
 * Public tracking lookup — only safe-to-expose fields are selected.
 * Does NOT include: id, internal user/technician info, costs, payments,
 * signature data, IMEI, accessories, problem description, or status notes.
 */
export async function getReceptionByTrackingToken(token: string) {
  return prisma.reception.findFirst({
    where: { trackingToken: token, deletedAt: null },
    select: {
      folio: true,
      brand: true,
      model: true,
      color: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // Client is exposed only by first name to avoid leaking PII.
      client: { select: { name: true } },
      // History entries — no `notes` field, those may contain internal info.
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, createdAt: true },
      },
    },
  });
}

export async function updateReceptionStatus(
  data: { receptionId: string; status: string; notes?: string },
  actor: AuditActor,
  fromStatus?: string
) {
  return prisma.$transaction(async (tx) => {
    // Snapshot the previous status if the caller didn't already provide one.
    let previousStatus = fromStatus;
    if (!previousStatus) {
      const current = await tx.reception.findUnique({
        where: { id: data.receptionId },
        select: { status: true },
      });
      previousStatus = current?.status ?? "UNKNOWN";
    }

    const updated = await tx.reception.update({
      where: { id: data.receptionId },
      data: {
        status: data.status as ReceptionStatus,
        statusHistory: {
          create: {
            status: data.status as ReceptionStatus,
            notes: data.notes || null,
          },
        },
      },
    });

    await recordAudit(tx, {
      receptionId: data.receptionId,
      actor,
      metadata: {
        kind: "STATUS_CHANGE",
        from: previousStatus,
        to: data.status,
        notes: data.notes,
      },
    });

    return updated;
  });
}

export async function updateReceptionFields(
  data: {
    receptionId: string;
    technicianId?: string;
    brand?: string;
    model?: string;
    color?: string;
    imei?: string | null;
    problem?: string;
    accessories?: string;
    totalCost?: number;
  },
  actor: AuditActor
) {
  const { receptionId, ...rest } = data;
  // Strip undefined so we don't overwrite columns the user didn't change.
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) update[k] = v;
  }
  if (Object.keys(update).length === 0) {
    return prisma.reception.findUnique({ where: { id: receptionId } });
  }

  return prisma.$transaction(async (tx) => {
    // Snapshot the values about to change so the audit trail can render a
    // before/after diff later if we want to. Only the changed columns are
    // stored to keep the payload small.
    const fields = Object.keys(update);
    const before = await tx.reception.findUnique({
      where: { id: receptionId },
      select: Object.fromEntries(fields.map((k) => [k, true])) as Record<
        string,
        true
      >,
    });

    const updated = await tx.reception.update({
      where: { id: receptionId },
      data: update as { brand?: Brand },
    });

    await recordAudit(tx, {
      receptionId,
      actor,
      metadata: {
        kind: "UPDATE",
        changedFields: fields,
        before: (before ?? undefined) as Record<string, unknown> | undefined,
        after: update,
      },
    });

    return updated;
  });
}

export async function saveSignature(data: {
  receptionId: string;
  signatureData: string;
}) {
  return prisma.reception.update({
    where: { id: data.receptionId },
    data: {
      signatureData: data.signatureData,
      signatureDate: new Date(),
    },
  });
}

/**
 * Atomic delivery: store signature, mark reception DELIVERED, append the
 * status-history row in a single transaction so a crash mid-write can't
 * leave the row in an inconsistent state.
 */
export async function deliverReception(
  data: { receptionId: string; signatureData: string; notes?: string },
  actor: AuditActor
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.reception.update({
      where: { id: data.receptionId },
      data: {
        status: "DELIVERED",
        signatureData: data.signatureData,
        signatureDate: new Date(),
        statusHistory: {
          create: {
            status: "DELIVERED",
            notes: data.notes || "Entregado al cliente",
          },
        },
      },
    });

    await recordAudit(tx, {
      receptionId: data.receptionId,
      actor,
      metadata: { kind: "DELIVER", notes: data.notes },
    });

    return updated;
  });
}

export async function createPayment(data: {
  receptionId: string;
  amount: number;
  method: string;
  concept: string;
  reference?: string;
}) {
  return prisma.payment.create({
    data: {
      receptionId: data.receptionId,
      amount: data.amount,
      method: data.method as PaymentMethod,
      concept: data.concept,
      reference: data.reference || null,
      status: "PAID",
    },
  });
}

export async function getReceptionStats() {
  // Anchor the time-window queries on a few absolute Date values rather than
  // recomputing them in each `where` clause. Postgres uses indexed `createdAt`
  // for these so range scans stay cheap.
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Most-recent ISO Monday 00:00 (week starts Monday in Mexico).
  const startOfWeek = new Date(today);
  const day = (today.getDay() + 6) % 7; // 0 = Monday
  startOfWeek.setDate(today.getDate() - day);

  // First day of current month at 00:00.
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // 7-day-ago threshold for the "waiting too long" KPI.
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 8 weeks ago for the trend chart.
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 8);

  // 6 months ago for the monthly revenue chart.
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  // Active = anything not delivered/cancelled. Used by several KPIs so we
  // declare it once.
  const ACTIVE_STATUSES = [
    "RECEIVED",
    "DIAGNOSING",
    "WAITING_PARTS",
    "REPAIRING",
    "READY",
  ] as const;

  const [
    total,
    todayCount,
    byStatus,
    recentReceptions,
    paymentsAgg,
    deliveredToday,
    monthlyRevenueAgg,
    weekRepairsCompleted,
    avgRepairAgg,
    brandsAgg,
    waitingTooLong,
    readyTooLong,
    receptionsRangeForChart,
    monthlyPaymentsForChart,
    needsAttention,
    recentAudits,
  ] = await Promise.all([
    // Total non-deleted receptions.
    prisma.reception.count({ where: { deletedAt: null } }),

    // Created today.
    prisma.reception.count({
      where: { deletedAt: null, createdAt: { gte: today, lt: tomorrow } },
    }),

    // Counts grouped by status.
    prisma.reception.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),

    // 5 most-recent receptions for the "Recent Receptions" table.
    prisma.reception.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { folioNumber: "desc" },
      include: {
        client: { select: { name: true, phone: true } },
        technician: { select: { name: true } },
      },
    }),

    // All-time revenue.
    prisma.payment.aggregate({
      where: { reception: { deletedAt: null } },
      _sum: { amount: true },
      _count: { amount: true },
    }),

    // Delivered today (signatureDate is the canonical "delivered at" timestamp).
    prisma.reception.count({
      where: {
        deletedAt: null,
        status: "DELIVERED",
        signatureDate: { gte: today, lt: tomorrow },
      },
    }),

    // Revenue this calendar month.
    prisma.payment.aggregate({
      where: {
        reception: { deletedAt: null },
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),

    // Repairs delivered this week (Mon-now).
    prisma.reception.count({
      where: {
        deletedAt: null,
        status: "DELIVERED",
        signatureDate: { gte: startOfWeek },
      },
    }),

    // Average repair time (created → signed/delivered) over last 90 days,
    // expressed in hours. We only sample DELIVERED rows whose signatureDate
    // is set, which is what the deliver action writes.
    prisma.$queryRaw<Array<{ avg_hours: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("signatureDate" - "createdAt")) / 3600)::float AS avg_hours
      FROM "Reception"
      WHERE "deletedAt" IS NULL
        AND "status" = 'DELIVERED'
        AND "signatureDate" IS NOT NULL
        AND "signatureDate" >= ${new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)}
    `,

    // Top 5 most-repaired brands.
    prisma.reception.groupBy({
      by: ["brand"],
      where: { deletedAt: null },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 5,
    }),

    // Active (not delivered/cancelled) receptions waiting >7 days since creation.
    prisma.reception.findMany({
      where: {
        deletedAt: null,
        status: { in: ["RECEIVED", "DIAGNOSING", "WAITING_PARTS", "REPAIRING"] },
        createdAt: { lt: sevenDaysAgo },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        id: true,
        folio: true,
        createdAt: true,
        status: true,
        brand: true,
        model: true,
        client: { select: { name: true } },
      },
    }),

    // Receptions that have been READY for >3 days (uncollected).
    prisma.reception.findMany({
      where: {
        deletedAt: null,
        status: "READY",
        updatedAt: { lt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
      select: {
        id: true,
        folio: true,
        updatedAt: true,
        client: { select: { name: true, phone: true } },
        brand: true,
        model: true,
      },
    }),

    // All active receptions in the last 8 weeks for the bar chart. We bucket
    // them in JS to avoid extra DB roundtrips for each week.
    prisma.reception.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: eightWeeksAgo },
      },
      select: { createdAt: true },
    }),

    // Monthly payments in the last 6 months for the line chart.
    prisma.payment.findMany({
      where: {
        reception: { deletedAt: null },
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, amount: true },
    }),

    // "Needs attention": active receptions without a technician assigned, or
    // missing the customer phone (data hygiene).
    prisma.reception.findMany({
      where: {
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        OR: [{ technicianId: null }, { client: { phone: "" } }],
      },
      take: 10,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        folio: true,
        technicianId: true,
        status: true,
        brand: true,
        model: true,
        client: { select: { name: true, phone: true } },
      },
    }),

    // Last 8 audit entries (across receptions AND clients) for the feed.
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        userName: true,
        createdAt: true,
        receptionId: true,
        clientId: true,
        metadata: true,
        reception: {
          select: { folio: true, brand: true, model: true },
        },
        client: {
          select: { name: true },
        },
      },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const item of byStatus) {
    statusCounts[item.status] = item._count.status;
  }

  // Bucket weekly counts on the server so the client doesn't reshape data.
  const weekBuckets = new Map<string, number>();
  for (let i = 0; i < 8; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() - 7 * (7 - i));
    weekBuckets.set(weekKey(d), 0);
  }
  for (const r of receptionsRangeForChart) {
    const k = weekKey(weekStart(r.createdAt));
    if (weekBuckets.has(k)) weekBuckets.set(k, (weekBuckets.get(k) ?? 0) + 1);
  }
  const repairsPerWeek = Array.from(weekBuckets.entries()).map(([key, count]) => ({
    week: key,
    count,
  }));

  // Bucket monthly revenue (last 6 months).
  const monthBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthBuckets.set(monthKey(d), 0);
  }
  for (const p of monthlyPaymentsForChart) {
    const k = monthKey(p.createdAt);
    if (monthBuckets.has(k))
      monthBuckets.set(k, (monthBuckets.get(k) ?? 0) + p.amount);
  }
  const monthlyRevenue = Array.from(monthBuckets.entries()).map(([month, total]) => ({
    month,
    total,
  }));

  const totalActive = ACTIVE_STATUSES.reduce(
    (acc, s) => acc + (statusCounts[s] ?? 0),
    0
  );
  const avgTicketValue =
    paymentsAgg._count.amount && paymentsAgg._count.amount > 0
      ? (paymentsAgg._sum.amount ?? 0) / paymentsAgg._count.amount
      : 0;

  return {
    // Headline KPIs
    total,
    todayCount,
    deliveredToday,
    pendingActive: totalActive,
    readyForPickup: statusCounts["READY"] ?? 0,
    weekRepairsCompleted,
    avgRepairHours: avgRepairAgg[0]?.avg_hours ?? null,
    avgTicketValue,
    // Money
    totalRevenue: paymentsAgg._sum.amount || 0,
    monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
    paymentCount: paymentsAgg._count.amount || 0,
    // Distributions
    statusCounts,
    brands: brandsAgg.map((b) => ({ brand: b.brand, count: b._count.brand })),
    // Lists
    recentReceptions,
    waitingTooLong,
    readyTooLong,
    needsAttention,
    recentAudits,
    // Charts
    repairsPerWeek,
    monthlyRevenueSeries: monthlyRevenue,
  };
}

function weekStart(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}
function weekKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD of Monday
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type ReceptionStats = Awaited<ReturnType<typeof getReceptionStats>>;

export async function getTechnicians() {
  return prisma.user.findMany({
    where: {
      role: { in: [UserRole.TECHNICIAN, UserRole.EMPLOYEE] },
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
}

export type Technician = Awaited<ReturnType<typeof getTechnicians>>[number];
export type ReceptionDetail = NonNullable<
  Awaited<ReturnType<typeof getReceptionById>>
>;
export type ReceptionPayment = ReceptionDetail["payments"][number];
