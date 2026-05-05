-- 기존에 제거되는 유형이 남아 있으면 OTHER로 옮긴 뒤 enum 교체
UPDATE "Inquiry"
SET "projectType" = 'OTHER'
WHERE "projectType"::text IN ('ADMIN_SYSTEM', 'SHOPPING_MALL');

CREATE TYPE "ProjectType_new" AS ENUM ('WEBSITE', 'MOBILE_APP', 'GAME', 'SERVICE_PROGRAM', 'OTHER');

ALTER TABLE "Inquiry" ALTER COLUMN "projectType" TYPE "ProjectType_new" USING ("projectType"::text::"ProjectType_new");

DROP TYPE "ProjectType";
ALTER TYPE "ProjectType_new" RENAME TO "ProjectType";
