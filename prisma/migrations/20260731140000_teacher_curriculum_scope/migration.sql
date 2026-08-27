-- Teacher curriculum scope for free create-paper (board + standard + subject)
CREATE TABLE "Teacher_Curriculum_Scope" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "board_id" INTEGER NOT NULL,
    "standard_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teacher_Curriculum_Scope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Teacher_Curriculum_Scope_user_id_standard_id_subject_id_key"
  ON "Teacher_Curriculum_Scope"("user_id", "standard_id", "subject_id");

CREATE INDEX "Teacher_Curriculum_Scope_user_id_board_id_idx"
  ON "Teacher_Curriculum_Scope"("user_id", "board_id");

ALTER TABLE "Teacher_Curriculum_Scope"
  ADD CONSTRAINT "Teacher_Curriculum_Scope_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Teacher_Curriculum_Scope"
  ADD CONSTRAINT "Teacher_Curriculum_Scope_board_id_fkey"
  FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Teacher_Curriculum_Scope"
  ADD CONSTRAINT "Teacher_Curriculum_Scope_standard_id_fkey"
  FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Teacher_Curriculum_Scope"
  ADD CONSTRAINT "Teacher_Curriculum_Scope_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
