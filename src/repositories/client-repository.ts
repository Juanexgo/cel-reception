import { prisma } from "@/lib/prisma";

export async function getAllClients() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { receptions: true } } },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      receptions: {
        orderBy: { createdAt: "desc" },
        include: { technician: { select: { name: true } } },
      },
    },
  });
}

export async function getClientByPhone(phone: string) {
  return prisma.client.findFirst({ where: { phone } });
}

export async function createClient(data: { name: string; phone: string; email?: string }) {
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
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
  });
}
