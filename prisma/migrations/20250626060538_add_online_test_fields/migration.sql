-- AlterTable
ALTER TABLE "Test_Paper" ADD COLUMN     "duration_minutes" INTEGER,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negative_marking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negative_marks_per_question" DOUBLE PRECISION,
ADD COLUMN     "randomize_options" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "randomize_questions" BOOLEAN NOT NULL DEFAULT false;
