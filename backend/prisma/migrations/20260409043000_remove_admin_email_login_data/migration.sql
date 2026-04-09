-- 남아있는 NULL userId 보정
UPDATE "AdminUser"
SET "userId" = CONCAT('admin_', id::text)
WHERE "userId" IS NULL;

-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "userId" SET NOT NULL;

-- 기존 이메일 로그인 관련 데이터 제거
DROP INDEX IF EXISTS "AdminUser_email_key";
ALTER TABLE "AdminUser" DROP COLUMN IF EXISTS "email";
