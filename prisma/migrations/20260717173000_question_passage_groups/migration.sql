-- Passage-linked MCQ groups (shared passage + 2+ child questions)

CREATE TABLE IF NOT EXISTS "Question_Group" (
    "id" SERIAL NOT NULL,
    "group_kind" VARCHAR NOT NULL DEFAULT 'PASSAGE_MCQ',
    "passage_text" TEXT NOT NULL,
    "passage_image_id" INTEGER,
    "external_key" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_Group_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Question_Group_external_key_key"
  ON "Question_Group"("external_key");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Question_Group_passage_image_id_fkey'
  ) THEN
    ALTER TABLE "Question_Group"
      ADD CONSTRAINT "Question_Group_passage_image_id_fkey"
      FOREIGN KEY ("passage_image_id") REFERENCES "Image"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "question_group_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "group_order" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "Question_question_group_id_group_order_key"
  ON "Question"("question_group_id", "group_order");

CREATE INDEX IF NOT EXISTS "Question_question_group_id_idx"
  ON "Question"("question_group_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Question_question_group_id_fkey'
  ) THEN
    ALTER TABLE "Question"
      ADD CONSTRAINT "Question_question_group_id_fkey"
      FOREIGN KEY ("question_group_id") REFERENCES "Question_Group"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Test_Paper_Question"
  ADD COLUMN IF NOT EXISTS "question_group_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "group_order" INTEGER;

CREATE INDEX IF NOT EXISTS "Test_Paper_Question_test_paper_id_question_group_id_group_order_idx"
  ON "Test_Paper_Question"("test_paper_id", "question_group_id", "group_order");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Test_Paper_Question_question_group_id_fkey'
  ) THEN
    ALTER TABLE "Test_Paper_Question"
      ADD CONSTRAINT "Test_Paper_Question_question_group_id_fkey"
      FOREIGN KEY ("question_group_id") REFERENCES "Question_Group"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
