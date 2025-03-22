/*
  Warnings:

  - You are about to drop the column `medium_standard_subject_id` on the `Chapter` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subject_id,standard_id,sequential_chapter_number]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `standard_id` to the `Chapter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `Chapter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instruction_medium_id` to the `Question_Text` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_medium_standard_subject_id_fkey";

-- DropIndex
DROP INDEX "Chapter_medium_standard_subject_id_sequential_chapter_numbe_key";

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "medium_standard_subject_id",
ADD COLUMN     "standard_id" INTEGER NOT NULL,
ADD COLUMN     "subject_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Question_Text" ADD COLUMN     "instruction_medium_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_subject_id_standard_id_sequential_chapter_number_key" ON "Chapter"("subject_id", "standard_id", "sequential_chapter_number");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text" ADD CONSTRAINT "Question_Text_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;
