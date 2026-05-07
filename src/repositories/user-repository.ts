import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "../../generated/prisma/client";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
}

export async function createUserService(data: { name: string; email: string; password?: string; role: string }) {
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : "";
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role as UserRole,
    },
  });
}

export async function updateUserPassword(userId: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export async function updateUserService(data: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  password?: string;
}) {
  const updateData: {
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    password?: string;
  } = {
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    isActive: data.isActive,
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id: data.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function countActiveAdmins(excludeUserId?: string) {
  return prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      isActive: true,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
  });
}

export async function verifyPassword(user: { password: string }, password: string) {
  return bcrypt.compare(password, user.password);
}
