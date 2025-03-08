/*
  Warnings:

  - A unique constraint covering the columns `[board_id,sequence_number]` on the table `Standard` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Standard" ADD COLUMN     "sequence_number" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Standard_board_id_sequence_number_key" ON "Standard"("board_id", "sequence_number");
