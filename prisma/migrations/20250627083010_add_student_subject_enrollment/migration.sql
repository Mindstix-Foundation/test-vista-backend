-- CreateTable
CREATE TABLE "Student_Subject_Enrollment" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "teacher_subject_id" INTEGER NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'pending',
    "request_message" TEXT,
    "teacher_response" TEXT,
    "academic_year" VARCHAR NOT NULL,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ,
    "enrollment_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Student_Subject_Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_Subject_Enrollment_student_id_teacher_subject_id_key" ON "Student_Subject_Enrollment"("student_id", "teacher_subject_id");

-- AddForeignKey
ALTER TABLE "Student_Subject_Enrollment" ADD CONSTRAINT "Student_Subject_Enrollment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Subject_Enrollment" ADD CONSTRAINT "Student_Subject_Enrollment_teacher_subject_id_fkey" FOREIGN KEY ("teacher_subject_id") REFERENCES "Teacher_Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
