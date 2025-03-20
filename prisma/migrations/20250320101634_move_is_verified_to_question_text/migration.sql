/*
  Warnings:

  - You are about to drop the column `is_verified` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "is_verified";

-- AlterTable
ALTER TABLE "Question_Text" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;
