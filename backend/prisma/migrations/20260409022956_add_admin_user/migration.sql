-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('WEBSITE', 'MOBILE_APP', 'ADMIN_SYSTEM', 'SHOPPING_MALL', 'OTHER');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "projectTypeDetail" TEXT,
    "developmentPurpose" TEXT NOT NULL,
    "keyFeatures" TEXT NOT NULL,
    "referenceLinks" TEXT,
    "expectedTimeline" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "inquiryDetails" TEXT NOT NULL,
    "attachmentUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
