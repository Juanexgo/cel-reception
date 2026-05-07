import 'dotenv/config'
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function getNextFolio(): Promise<string> {
  const latest = await prisma.reception.findFirst({
    orderBy: { folio: "desc" },
    select: { folio: true },
  });

  if (latest) {
    const num = parseInt(latest.folio.split("-")[1], 10) + 1;
    return `REC-${String(num).padStart(6, "0")}`;
  }
  return "REC-000001";
}

function generateTrackingToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "tok_";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
      brand: data.brand as any,
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

export async function getReceptionByTrackingToken(token: string) {
  return prisma.reception.findUnique({
    where: { trackingToken: token },
    select: {
      id: true,
      folio: true,
      trackingToken: true,
      brand: true,
      model: true,
      color: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      client: { select: { name: true, phone: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, select: { id: true, status: true, notes: true, createdAt: true } },
    },
  });
}

export async function updateReceptionStatus(data: { receptionId: string; status: string; notes?: string }) {
  return prisma.reception.update({
    where: { id: data.receptionId },
    data: {
      status: data.status as any,
      statusHistory: {
        create: {
          status: data.status as any,
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
      method: data.method as any,
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
    where: { role: { in: ["TECHNICIAN", "EMPLOYEE"] as any } },
    select: { id: true, name: true, email: true, role: true },
  });
}
