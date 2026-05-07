import 'dotenv/config'
import { PrismaClient, UserRole, Brand, ReceptionStatus } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@centroservicio.com" },
    update: {},
    create: {
      email: "admin@centroservicio.com",
      name: "Administrador",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: "tecnico@centroservicio.com" },
    update: {},
    create: {
      email: "tecnico@centroservicio.com",
      name: "Técnico Demo",
      password: await bcrypt.hash("tecnico123", 10),
      role: UserRole.TECHNICIAN,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "empleado@centroservicio.com" },
    update: {},
    create: {
      email: "empleado@centroservicio.com",
      name: "Empleado Demo",
      password: await bcrypt.hash("empleado123", 10),
      role: UserRole.EMPLOYEE,
    },
  });

  console.log("Users seeded:", admin.email, tech.email, employee.email);

  const client1 = await prisma.client.upsert({
    where: { phone: "9991234567" },
    update: {},
    create: {
      name: "Juan Pérez",
      phone: "9991234567",
      email: "juan@example.com",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { phone: "9997654321" },
    update: {},
    create: {
      name: "María García",
      phone: "9997654321",
      email: "maria@example.com",
    },
  });

  console.log("Clients seeded:", client1.name, client2.name);

  const r1 = await prisma.reception.create({
    data: {
      folio: "REC-000001",
      trackingToken: "tok_demo_abc123",
      clientId: client1.id,
      technicianId: tech.id,
      brand: Brand.APPLE,
      model: "iPhone 14 Pro",
      color: "Negro",
      imei: "353456789012345",
      problem: "Pantalla rota, no enciende",
      accessories: "Cable USB, funda",
      status: ReceptionStatus.RECEIVED,
      statusHistory: {
        create: { status: ReceptionStatus.RECEIVED, notes: "Recepción inicial" },
      },
    },
  });

  const r2 = await prisma.reception.create({
    data: {
      folio: "REC-000002",
      trackingToken: "tok_demo_def456",
      clientId: client2.id,
      brand: Brand.SAMSUNG,
      model: "Galaxy S23",
      color: "Verde",
      problem: "No carga, puerto dañado",
      accessories: "Ninguno",
      status: ReceptionStatus.DIAGNOSING,
      statusHistory: {
        create: [
          { status: ReceptionStatus.RECEIVED, notes: "Recepción inicial" },
          { status: ReceptionStatus.DIAGNOSING, notes: "En diagnóstico" },
        ],
      },
    },
  });

  console.log("Demo receptions created:", r1.folio, r2.folio);
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
