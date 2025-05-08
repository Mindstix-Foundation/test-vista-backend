/*
  Warnings:

  - You are about to drop the column `test_paper_origin_id` on the `Test_Paper` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TestPaperOriginType" AS ENUM ('board', 'other', 'both');

-- AlterTable
ALTER TABLE "Test_Paper" DROP COLUMN "test_paper_origin_id",
ADD COLUMN     "test_paper_origin_type" "TestPaperOriginType";
