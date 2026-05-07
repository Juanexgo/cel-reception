-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('APPLE', 'SAMSUNG', 'HUAWEI', 'XIAOMI', 'OPPO', 'VIVO', 'MOTOROLA', 'LG', 'GOOGLE', 'ONEPLUS', 'NOKIA', 'SONY', 'ZTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReceptionStatus" AS ENUM ('RECEIVED', 'DIAGNOSING', 'WAITING_PARTS', 'REPAIRING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reception" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "technicianId" TEXT,
    "brand" "Brand" NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "imei" TEXT,
    "problem" TEXT NOT NULL,
    "accessories" TEXT NOT NULL,
    "status" "ReceptionStatus" NOT NULL DEFAULT 'RECEIVED',
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "signatureData" TEXT,
    "signatureDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "status" "ReceptionStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "concept" TEXT NOT NULL,
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Reception_folio_key" ON "Reception"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Reception_trackingToken_key" ON "Reception"("trackingToken");

-- AddForeignKey
ALTER TABLE "Reception" ADD CONSTRAINT "Reception_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reception" ADD CONSTRAINT "Reception_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "Reception"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "Reception"("id") ON DELETE CASCADE ON UPDATE CASCADE;
