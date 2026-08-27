-- Smart Test provenance + safe legacy open-practice migration

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Test_Paper' AND column_name = 'is_open_practice'
  ) THEN
    ALTER TABLE "Test_Paper" ADD COLUMN "is_open_practice" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE "TestPaperCreationMode" AS ENUM ('TEACHER_CREATED', 'STUDENT_SMART', 'LEGACY_OPEN_PRACTICE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TestAssignmentSource" AS ENUM ('TEACHER_ASSIGNED', 'SELF_SMART', 'LEGACY_PRACTICE_START');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Test_Paper"
  ADD COLUMN IF NOT EXISTS "creation_mode" "TestPaperCreationMode" NOT NULL DEFAULT 'TEACHER_CREATED',
  ADD COLUMN IF NOT EXISTS "generation_policy" VARCHAR,
  ADD COLUMN IF NOT EXISTS "generation_seed" VARCHAR,
  ADD COLUMN IF NOT EXISTS "generation_request" JSONB;

ALTER TABLE "Test_Assignment"
  ADD COLUMN IF NOT EXISTS "assignment_source" "TestAssignmentSource" NOT NULL DEFAULT 'TEACHER_ASSIGNED';

UPDATE "Test_Paper"
SET "creation_mode" = 'LEGACY_OPEN_PRACTICE'
WHERE "is_open_practice" = true
  AND "creation_mode" = 'TEACHER_CREATED';

UPDATE "Test_Assignment" ta
SET "assignment_source" = 'LEGACY_PRACTICE_START'
FROM "Test_Paper" tp
WHERE ta."test_paper_id" = tp."id"
  AND tp."creation_mode" = 'LEGACY_OPEN_PRACTICE'
  AND ta."max_attempts" = 3
  AND ta."assignment_source" = 'TEACHER_ASSIGNED';
