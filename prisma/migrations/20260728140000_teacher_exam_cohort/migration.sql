-- P8: Teacher_Exam_Cohort teaching graph for coaching cohorts

CREATE TABLE "Teacher_Exam_Cohort" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "exam_cohort_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Teacher_Exam_Cohort_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Teacher_Exam_Cohort_user_id_exam_cohort_id_key" ON "Teacher_Exam_Cohort"("user_id", "exam_cohort_id");
CREATE INDEX "Teacher_Exam_Cohort_exam_cohort_id_idx" ON "Teacher_Exam_Cohort"("exam_cohort_id");

ALTER TABLE "Teacher_Exam_Cohort" ADD CONSTRAINT "Teacher_Exam_Cohort_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher_Exam_Cohort" ADD CONSTRAINT "Teacher_Exam_Cohort_exam_cohort_id_fkey" FOREIGN KEY ("exam_cohort_id") REFERENCES "Exam_Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
