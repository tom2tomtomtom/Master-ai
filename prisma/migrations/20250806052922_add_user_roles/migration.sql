-- CreateEnum
CREATE TYPE "public"."user_roles" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "role" "public"."user_roles" NOT NULL DEFAULT 'USER';
