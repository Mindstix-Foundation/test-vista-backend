-- CreateEnum
CREATE TYPE "ExamCategoryType" AS ENUM ('BOARD', 'ENTRANCE', 'COMPETITIVE');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'COACHING_CENTER', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('SCHOOL_STUDENT', 'INSTITUTE_STUDENT', 'ASPIRANT');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('OFFLINE_PDF', 'ONLINE_MCQ', 'ONLINE_MIXED');

-- CreateEnum
CREATE TYPE "SyllabusNodeType" AS ENUM ('SECTION', 'SUBJECT', 'CHAPTER', 'TOPIC');

-- CreateEnum
CREATE TYPE "AnswerFormat" AS ENUM ('MCQ', 'NUMERIC', 'TEXT', 'MATCH_PAIR');

-- AlterTable
ALTER TABLE "Student_Answer" ADD COLUMN     "numeric_answer" DOUBLE PRECISION,
ADD COLUMN     "text_answer" TEXT;

-- AlterTable
ALTER TABLE "Student_Result" ADD COLUMN     "rank_in_cohort" INTEGER,
ADD COLUMN     "section_wise_scores" JSONB;

-- AlterTable
ALTER TABLE "Test_Attempt" ADD COLUMN     "current_section_id" INTEGER,
ADD COLUMN     "section_started_at" TIMESTAMPTZ(6),
ADD COLUMN     "section_timings" JSONB;

-- AlterTable
ALTER TABLE "Test_Paper" ADD COLUMN     "delivery_mode" "DeliveryMode",
ADD COLUMN     "exam_program_id" INTEGER,
ADD COLUMN     "exam_stage_id" INTEGER,
ADD COLUMN     "institution_id" INTEGER,
ADD COLUMN     "paper_template_id" INTEGER;

-- CreateTable
CREATE TABLE "Exam_Category" (
    "id" SERIAL NOT NULL,
    "code" "ExamCategoryType" NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Exam_Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam_Body" (
    "id" SERIAL NOT NULL,
    "exam_category_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "abbreviation" VARCHAR NOT NULL,
    "logo_url" VARCHAR,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "board_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Exam_Body_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam_Program" (
    "id" SERIAL NOT NULL,
    "exam_body_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "code" VARCHAR NOT NULL,
    "description" TEXT,
    "default_duration_minutes" INTEGER,
    "has_negative_marking" BOOLEAN NOT NULL DEFAULT false,
    "negative_marks_ratio" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Exam_Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam_Stage" (
    "id" SERIAL NOT NULL,
    "exam_program_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "is_qualifying" BOOLEAN NOT NULL DEFAULT false,
    "qualifying_pct" DOUBLE PRECISION,
    "standard_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Exam_Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Syllabus_Node" (
    "id" SERIAL NOT NULL,
    "exam_program_id" INTEGER NOT NULL,
    "exam_stage_id" INTEGER,
    "parent_id" INTEGER,
    "node_type" "SyllabusNodeType" NOT NULL,
    "name" VARCHAR NOT NULL,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "legacy_subject_id" INTEGER,
    "legacy_chapter_id" INTEGER,
    "legacy_topic_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Syllabus_Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question_Syllabus_Node" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "syllabus_node_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_Syllabus_Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper_Template" (
    "id" SERIAL NOT NULL,
    "exam_program_id" INTEGER NOT NULL,
    "exam_stage_id" INTEGER,
    "name" VARCHAR NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "total_questions" INTEGER,
    "duration_minutes" INTEGER,
    "delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'ONLINE_MCQ',
    "negative_marking" BOOLEAN NOT NULL DEFAULT false,
    "negative_marks_ratio" DOUBLE PRECISION,
    "nat_tolerance" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "legacy_pattern_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Paper_Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template_Section" (
    "id" SERIAL NOT NULL,
    "paper_template_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "mandatory_questions" INTEGER NOT NULL,
    "marks_per_question" DOUBLE PRECISION NOT NULL,
    "time_limit_minutes" INTEGER,
    "qualifying_marks" DOUBLE PRECISION,
    "negative_marks_per_question" DOUBLE PRECISION,
    "answer_format" "AnswerFormat" NOT NULL DEFAULT 'MCQ',
    "syllabus_node_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Template_Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template_Section_Question_Type" (
    "id" SERIAL NOT NULL,
    "template_section_id" INTEGER NOT NULL,
    "question_type_id" INTEGER NOT NULL,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_Section_Question_Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" SERIAL NOT NULL,
    "institution_type" "InstitutionType" NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR,
    "contact_number" VARCHAR,
    "principal_name" VARCHAR,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "school_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution_Program" (
    "id" SERIAL NOT NULL,
    "institution_id" INTEGER NOT NULL,
    "exam_program_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam_Cohort" (
    "id" SERIAL NOT NULL,
    "exam_program_id" INTEGER NOT NULL,
    "institution_id" INTEGER,
    "name" VARCHAR NOT NULL,
    "academic_year" VARCHAR,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Exam_Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "participant_type" "ParticipantType" NOT NULL,
    "institution_id" INTEGER,
    "exam_cohort_id" INTEGER,
    "registration_code" VARCHAR,
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "student_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant_Program" (
    "id" SERIAL NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "exam_program_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_Program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Category_code_key" ON "Exam_Category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Body_name_key" ON "Exam_Body"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Body_abbreviation_key" ON "Exam_Body"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Body_board_id_key" ON "Exam_Body"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Program_code_key" ON "Exam_Program"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Program_exam_body_id_name_key" ON "Exam_Program"("exam_body_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Stage_standard_id_key" ON "Exam_Stage"("standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Stage_exam_program_id_name_key" ON "Exam_Stage"("exam_program_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Stage_exam_program_id_sequence_number_key" ON "Exam_Stage"("exam_program_id", "sequence_number");

-- CreateIndex
CREATE INDEX "Syllabus_Node_exam_program_id_node_type_idx" ON "Syllabus_Node"("exam_program_id", "node_type");

-- CreateIndex
CREATE INDEX "Syllabus_Node_parent_id_idx" ON "Syllabus_Node"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "Question_Syllabus_Node_question_id_syllabus_node_id_key" ON "Question_Syllabus_Node"("question_id", "syllabus_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "Paper_Template_legacy_pattern_id_key" ON "Paper_Template"("legacy_pattern_id");

-- CreateIndex
CREATE UNIQUE INDEX "Paper_Template_exam_program_id_name_key" ON "Paper_Template"("exam_program_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Template_Section_paper_template_id_sequence_number_key" ON "Template_Section"("paper_template_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "Template_Section_Question_Type_template_section_id_question_key" ON "Template_Section_Question_Type"("template_section_id", "question_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_school_id_key" ON "Institution"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_Program_institution_id_exam_program_id_key" ON "Institution_Program"("institution_id", "exam_program_id");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_Cohort_exam_program_id_name_key" ON "Exam_Cohort"("exam_program_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_registration_code_key" ON "Participant"("registration_code");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_student_id_key" ON "Participant"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_user_id_participant_type_key" ON "Participant"("user_id", "participant_type");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_Program_participant_id_exam_program_id_key" ON "Participant_Program"("participant_id", "exam_program_id");

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_exam_stage_id_fkey" FOREIGN KEY ("exam_stage_id") REFERENCES "Exam_Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_paper_template_id_fkey" FOREIGN KEY ("paper_template_id") REFERENCES "Paper_Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Body" ADD CONSTRAINT "Exam_Body_exam_category_id_fkey" FOREIGN KEY ("exam_category_id") REFERENCES "Exam_Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Body" ADD CONSTRAINT "Exam_Body_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Program" ADD CONSTRAINT "Exam_Program_exam_body_id_fkey" FOREIGN KEY ("exam_body_id") REFERENCES "Exam_Body"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Stage" ADD CONSTRAINT "Exam_Stage_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Stage" ADD CONSTRAINT "Exam_Stage_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus_Node" ADD CONSTRAINT "Syllabus_Node_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus_Node" ADD CONSTRAINT "Syllabus_Node_exam_stage_id_fkey" FOREIGN KEY ("exam_stage_id") REFERENCES "Exam_Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus_Node" ADD CONSTRAINT "Syllabus_Node_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Syllabus_Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus_Node" ADD CONSTRAINT "Syllabus_Node_legacy_subject_id_fkey" FOREIGN KEY ("legacy_subject_id") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus_Node" ADD CONSTRAINT "Syllabus_Node_legacy_chapter_id_fkey" FOREIGN KEY ("legacy_chapter_id") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Syllabus_Node" ADD CONSTRAINT "Syllabus_Node_legacy_topic_id_fkey" FOREIGN KEY ("legacy_topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Syllabus_Node" ADD CONSTRAINT "Question_Syllabus_Node_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Syllabus_Node" ADD CONSTRAINT "Question_Syllabus_Node_syllabus_node_id_fkey" FOREIGN KEY ("syllabus_node_id") REFERENCES "Syllabus_Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper_Template" ADD CONSTRAINT "Paper_Template_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper_Template" ADD CONSTRAINT "Paper_Template_exam_stage_id_fkey" FOREIGN KEY ("exam_stage_id") REFERENCES "Exam_Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper_Template" ADD CONSTRAINT "Paper_Template_legacy_pattern_id_fkey" FOREIGN KEY ("legacy_pattern_id") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template_Section" ADD CONSTRAINT "Template_Section_paper_template_id_fkey" FOREIGN KEY ("paper_template_id") REFERENCES "Paper_Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template_Section" ADD CONSTRAINT "Template_Section_syllabus_node_id_fkey" FOREIGN KEY ("syllabus_node_id") REFERENCES "Syllabus_Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template_Section_Question_Type" ADD CONSTRAINT "Template_Section_Question_Type_template_section_id_fkey" FOREIGN KEY ("template_section_id") REFERENCES "Template_Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template_Section_Question_Type" ADD CONSTRAINT "Template_Section_Question_Type_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "Question_Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution_Program" ADD CONSTRAINT "Institution_Program_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution_Program" ADD CONSTRAINT "Institution_Program_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Cohort" ADD CONSTRAINT "Exam_Cohort_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam_Cohort" ADD CONSTRAINT "Exam_Cohort_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_exam_cohort_id_fkey" FOREIGN KEY ("exam_cohort_id") REFERENCES "Exam_Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant_Program" ADD CONSTRAINT "Participant_Program_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant_Program" ADD CONSTRAINT "Participant_Program_exam_program_id_fkey" FOREIGN KEY ("exam_program_id") REFERENCES "Exam_Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
