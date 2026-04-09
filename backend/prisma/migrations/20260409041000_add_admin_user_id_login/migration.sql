-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "userId" TEXT;

-- 기존 계정 중 첫 계정은 기본 아이디로 지정
WITH first_admin AS (
  SELECT id
  FROM "AdminUser"
  ORDER BY id ASC
  LIMIT 1
)
UPDATE "AdminUser"
SET "userId" = 'admin'
WHERE id IN (SELECT id FROM first_admin)
  AND "userId" IS NULL;

-- 혹시 남은 계정이 있다면 충돌 없는 아이디 자동 부여
UPDATE "AdminUser"
SET "userId" = CONCAT('admin_', id::text)
WHERE "userId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_userId_key" ON "AdminUser"("userId");
