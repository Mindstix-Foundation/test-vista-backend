-- CreateEnum
CREATE TYPE "ExamBodyJurisdiction" AS ENUM ('NATIONAL', 'STATE', 'INSTITUTIONAL');

-- AlterTable
ALTER TABLE "Exam_Body" ADD COLUMN "jurisdiction" "ExamBodyJurisdiction";

-- CreateIndex
CREATE INDEX "Exam_Body_exam_category_id_is_active_idx" ON "Exam_Body"("exam_category_id", "is_active");

-- CreateIndex
CREATE INDEX "Exam_Program_exam_body_id_is_active_idx" ON "Exam_Program"("exam_body_id", "is_active");

-- CreateIndex
CREATE INDEX "Question_Syllabus_Node_syllabus_node_id_idx" ON "Question_Syllabus_Node"("syllabus_node_id");

-- Backfill jurisdiction for known conducting bodies (non-board-linked)
UPDATE "Exam_Body" SET "jurisdiction" = 'NATIONAL'
WHERE "board_id" IS NULL AND "abbreviation" IN ('UPSC', 'NTA', 'IBPS');

UPDATE "Exam_Body" SET "jurisdiction" = 'STATE'
WHERE "board_id" IS NULL AND "abbreviation" IN ('MPSC', 'MH-CET-CELL');

UPDATE "Exam_Body" SET "jurisdiction" = 'INSTITUTIONAL'
WHERE "board_id" IS NULL AND "abbreviation" = 'SBI';
