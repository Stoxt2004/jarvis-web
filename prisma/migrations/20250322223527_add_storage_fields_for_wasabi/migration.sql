/*
  Warnings:

  - The `plan` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `plan` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AIRequestLog" ALTER COLUMN "tokenCount" DROP DEFAULT,
ALTER COLUMN "successful" DROP DEFAULT;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "storageUrl" TEXT,
ALTER COLUMN "size" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "content" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "plan",
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
DROP COLUMN "plan",
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE',
ALTER COLUMN "preferences" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "data" DROP NOT NULL,
ALTER COLUMN "data" DROP DEFAULT;

-- DropEnum
DROP TYPE "Plan";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "SubscriptionStatus";
