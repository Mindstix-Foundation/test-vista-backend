/*
  Warnings:

  - A unique constraint covering the columns `[school_id,instruction_medium_id]` on the table `School_Instruction_Medium` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[school_id,standard_id]` on the table `School_Standard` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "School_Instruction_Medium_school_id_key";

-- DropIndex
DROP INDEX "School_Standard_school_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "School_Instruction_Medium_school_id_instruction_medium_id_key" ON "School_Instruction_Medium"("school_id", "instruction_medium_id");

-- CreateIndex
CREATE UNIQUE INDEX "School_Standard_school_id_standard_id_key" ON "School_Standard"("school_id", "standard_id");
