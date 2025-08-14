-- AlterTable
ALTER TABLE "Student_Analytics" ADD COLUMN     "total_practice_tests" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Test_Attempt" ADD COLUMN     "is_practice" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Practice_Answer" (
    "id" SERIAL NOT NULL,
    "practice_attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER,
    "is_correct" BOOLEAN,
    "time_spent_seconds" INTEGER,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Practice_Answer_pkey" PRIMARY KEY ("id")
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
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "time_taken_seconds" INTEGER,
    "score_percentage" DOUBLE PRECISION,
    "correct_answers" INTEGER,
    "wrong_answers" INTEGER,
    "skipped_answers" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Practice_Attempt_pkey" PRIMARY KEY ("id")
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
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Practice_Answer_practice_attempt_id_question_id_key" ON "Practice_Answer"("practice_attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_practice_attempt_id_fkey" FOREIGN KEY ("practice_attempt_id") REFERENCES "Practice_Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Answer" ADD CONSTRAINT "Practice_Answer_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "Mcq_Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice_Attempt" ADD CONSTRAINT "Practice_Attempt_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student_Notification" ADD CONSTRAINT "Student_Notification_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
