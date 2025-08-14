/*
  Warnings:

  - You are about to drop the column `seqencial_section_number` on the `Section` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pattern_id,sequence_number]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `section_number` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequence_number` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Section_pattern_id_seqencial_section_number_key";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "seqencial_section_number",
ADD COLUMN     "section_number" INTEGER NOT NULL,
ADD COLUMN     "sequence_number" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Section_pattern_id_sequence_number_key" ON "Section"("pattern_id", "sequence_number");
