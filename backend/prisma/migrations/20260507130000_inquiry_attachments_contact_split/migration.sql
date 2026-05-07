-- CreateTable
CREATE TABLE "inquiry_attachments" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inquiry_attachments_inquiryId_idx" ON "inquiry_attachments"("inquiryId");

ALTER TABLE "inquiry_attachments" ADD CONSTRAINT "inquiry_attachments_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy attachmentUrls[] into inquiry_attachments
INSERT INTO "inquiry_attachments" ("inquiryId", "url", "fileName", "createdAt")
SELECT i."id", trim(both FROM u.url), NULL, CURRENT_TIMESTAMP(3)
FROM "Inquiry" i
CROSS JOIN LATERAL unnest(COALESCE(i."attachmentUrls", ARRAY[]::text[])) AS u(url)
WHERE trim(both FROM u.url) <> '';

-- Split contact into phone / email
ALTER TABLE "Inquiry" ADD COLUMN "phone" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';

UPDATE "Inquiry" SET "phone" = "contact", "email" = '';

ALTER TABLE "Inquiry" ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "Inquiry" DROP COLUMN "attachmentUrls";
ALTER TABLE "Inquiry" DROP COLUMN "contact";

ALTER TABLE "Inquiry" RENAME COLUMN "adminMemo" TO "memo";

ALTER TABLE "Inquiry" ADD COLUMN "estimatedPrice" DECIMAL(12,2),
ADD COLUMN "customerIp" VARCHAR(45),
ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "source" TEXT,
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
