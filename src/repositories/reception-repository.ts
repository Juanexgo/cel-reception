import { prisma } from "@/lib/prisma";
import {
  Brand,
  PaymentMethod,
  ReceptionStatus,
  UserRole,
} from "../../generated/prisma/client";

async function getNextFolio(): Promise<string> {
  const latest = await prisma.reception.findFirst({
    orderBy: { folio: "desc" },
    select: { folio: true },
  });

  if (!latest) return "REC-000001";

  const parsed = parseInt(latest.folio.split("-")[1] ?? "", 10);
  const num = Number.isFinite(parsed) ? parsed + 1 : 1;
  return `REC-${String(num).padStart(6, "0")}`;
}

function generateTrackingToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 20);
  return `tok_${token}`;
}

export async function createReception(data: {
  clientId: string;
  technicianId?: string;
  brand: string;
  model: string;
  color: string;
  imei?: string;
  problem: string;
  accessories: string;
  totalCost: number;
}) {
  const folio = await getNextFolio();
  const trackingToken = generateTrackingToken();

  return prisma.reception.create({
    data: {
      folio,
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
}

export async function getAllReceptions(search?: string, statusFilter?: string) {
  const where: Record<string, unknown> = {};

  if (search) {
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
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, phone: true } },
      technician: { select: { name: true } },
      _count: { select: { payments: true } },
    },
  });
}

export async function getReceptionById(id: string) {
  return prisma.reception.findUnique({
    where: { id },
    include: {
      client: true,
      technician: { select: { name: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * Public tracking lookup — only safe-to-expose fields are selected.
 * Does NOT include: id, internal user/technician info, costs, payments,
 * signature data, IMEI, accessories, problem description, or status notes.
 */
export async function getReceptionByTrackingToken(token: string) {
  return prisma.reception.findUnique({
    where: { trackingToken: token },
    select: {
      folio: true,
      brand: true,
      model: true,
      color: true,
      status: true,
      createdAt: true,
      client: { select: { name: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true, createdAt: true },
      },
    },
  });
}

export async function updateReceptionStatus(data: { receptionId: string; status: string; notes?: string }) {
  return prisma.reception.update({
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
}

export async function saveSignature(data: { receptionId: string; signatureData: string }) {
  return prisma.reception.update({
    where: { id: data.receptionId },
    data: {
      signatureData: data.signatureData,
      signatureDate: new Date(),
    },
  });
}

export async function createPayment(data: { receptionId: string; amount: number; method: string; concept: string; reference?: string }) {
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [total, todayCount, byStatus, recentReceptions, payments] = await Promise.all([
    prisma.reception.count(),
    prisma.reception.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.reception.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.reception.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, phone: true } },
        technician: { select: { name: true } },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { amount: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const item of byStatus) {
    statusCounts[item.status] = item._count.status;
  }

  return {
    total,
    todayCount,
    statusCounts,
    recentReceptions,
    totalRevenue: payments._sum.amount || 0,
    paymentCount: payments._count.amount || 0,
  };
}

export async function getTechnicians() {
  return prisma.user.findMany({
    where: { role: { in: [UserRole.TECHNICIAN, UserRole.EMPLOYEE] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
}

export type Technician = Awaited<ReturnType<typeof getTechnicians>>[number];
export type ReceptionDetail = NonNullable<
  Awaited<ReturnType<typeof getReceptionById>>
>;
export type ReceptionPayment = ReceptionDetail["payments"][number];
