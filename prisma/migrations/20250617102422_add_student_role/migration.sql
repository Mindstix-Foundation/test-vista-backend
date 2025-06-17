-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_id" VARCHAR NOT NULL,
    "date_of_birth" DATE,
    "enrollment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "school_standard_id" INTEGER NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Assignment" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "test_paper_id" INTEGER NOT NULL,
    "assigned_by_user_id" INTEGER NOT NULL,
    "assigned_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMPTZ NOT NULL,
    "available_from" TIMESTAMPTZ NOT NULL,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "time_limit_minutes" INTEGER,
    "status" VARCHAR NOT NULL DEFAULT 'assigned',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Test_Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Attempt" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "test_assignment_id" INTEGER NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ,
    "time_taken_seconds" INTEGER,
    "status" VARCHAR NOT NULL DEFAULT 'in_progress',
    "current_question" INTEGER,
    "is_practice" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Test_Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practice_Attempt" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "standard_id" INTEGER NOT NULL,
    "chapter_id" INTEGER,
    "topic_id" INTEGER,
    "total_questions" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "time_taken_seconds" INTEGER,
    "score_percentage" DOUBLE PRECISION,
    "correct_answers" INTEGER,
    "wrong_answers" INTEGER,
    "skipped_answers" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Practice_Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student_Answer" (
    "id" SERIAL NOT NULL,
    "test_attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER,
    "is_correct" BOOLEAN,
    "marks_obtained" DOUBLE PRECISION,
    "time_spent_seconds" INTEGER,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practice_Answer" (
    "id" SERIAL NOT NULL,
    "practice_attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER,
    "is_correct" BOOLEAN,
    "time_spent_seconds" INTEGER,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Practice_Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student_Result" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "test_attempt_id" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "attempted_questions" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "wrong_answers" INTEGER NOT NULL,
    "skipped_questions" INTEGER NOT NULL,
    "total_marks" DOUBLE PRECISION NOT NULL,
    "obtained_marks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "grade" VARCHAR,
    "rank_in_standard" INTEGER,
    "time_taken_seconds" INTEGER NOT NULL,
    "performance_level" VARCHAR NOT NULL,
    "subject_wise_scores" JSONB,
    "chapter_wise_analysis" JSONB,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendations" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Student_Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student_Analytics" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "total_tests_taken" INTEGER NOT NULL DEFAULT 0,
    "total_practice_tests" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION,
    "best_score" DOUBLE PRECISION,
    "worst_score" DOUBLE PRECISION,
    "last_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Student_Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student_Notification" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "title" VARCHAR NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR NOT NULL,
    "priority" VARCHAR NOT NULL DEFAULT 'normal',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" VARCHAR,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_user_id_key" ON "Student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_id_school_standard_id_key" ON "Student"("student_id", "school_standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "Test_Assignment_student_id_test_paper_id_key" ON "Test_Assignment"("student_id", "test_paper_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_Answer_test_attempt_id_question_id_key" ON "Student_Answer"("test_attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "Practice_Answer_practice_attempt_id_question_id_key" ON "Practice_Answer"("practice_attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_Result_test_attempt_id_key" ON "Student_Result"("test_attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_Analytics_student_id_key" ON "Student_Analytics"("student_id");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_school_standard_id_fkey" FOREIGN KEY ("school_standard_id") REFERENCES "School_Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Assignment" ADD CONSTRAINT "Test_Assignment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Assignment" ADD CONSTRAINT "Test_Assignment_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Assignment" ADD CONSTRAINT "Test_Assignment_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Attempt" ADD CONSTRAINT "Test_Attempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Attempt" ADD CONSTRAINT "Test_Attempt_test_assignment_id_fkey" FOREIGN KEY ("test_assignment_id") REFERENCES "Test_Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Answer" ADD CONSTRAINT "Student_Answer_test_attempt_id_fkey" FOREIGN KEY ("test_attempt_id") REFERENCES "Test_Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Answer" ADD CONSTRAINT "Student_Answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Answer" ADD CONSTRAINT "Student_Answer_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Answer" ADD CONSTRAINT "Student_Answer_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "Mcq_Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_practice_attempt_id_fkey" FOREIGN KEY ("practice_attempt_id") REFERENCES "Practice_Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "Mcq_Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Result" ADD CONSTRAINT "Student_Result_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Result" ADD CONSTRAINT "Student_Result_test_attempt_id_fkey" FOREIGN KEY ("test_attempt_id") REFERENCES "Test_Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Analytics" ADD CONSTRAINT "Student_Analytics_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Notification" ADD CONSTRAINT "Student_Notification_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert STUDENT role if it doesn't exist
INSERT INTO "Role" ("role_name") 
SELECT 'STUDENT' 
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" WHERE "role_name" = 'STUDENT'
);
