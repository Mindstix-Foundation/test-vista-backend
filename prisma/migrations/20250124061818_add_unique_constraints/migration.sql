/*
  Warnings:

  - You are about to drop the `Board` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[board_id,instruction_medium]` on the table `Instruction_Medium` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[board_id,name]` on the table `Standard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[board_id,name]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Board" DROP CONSTRAINT "Board_address_id_fkey";

-- DropForeignKey
ALTER TABLE "Instruction_Medium" DROP CONSTRAINT "Instruction_Medium_board_id_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Standard" DROP CONSTRAINT "Standard_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_board_id_fkey";

-- DropTable
DROP TABLE "Board";

-- CreateTable
CREATE TABLE "boards" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "UPPER(abbreviation)" VARCHAR NOT NULL,
    "address_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boards_name_key" ON "boards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "boards_UPPER(abbreviation)_key" ON "boards"("UPPER(abbreviation)");

-- CreateIndex
CREATE UNIQUE INDEX "boards_address_id_key" ON "boards"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "Instruction_Medium_board_id_instruction_medium_key" ON "Instruction_Medium"("board_id", "instruction_medium");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_board_id_name_key" ON "Standard"("board_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_board_id_name_key" ON "Subject"("board_id", "name");

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction_Medium" ADD CONSTRAINT "Instruction_Medium_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
