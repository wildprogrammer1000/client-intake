-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "adminMemo" TEXT,
ADD COLUMN     "status" "InquiryStatus" NOT NULL DEFAULT 'WAITING';
