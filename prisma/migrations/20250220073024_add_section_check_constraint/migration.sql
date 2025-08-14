-- CreateTable
CREATE TABLE "Question_Type" (
    "id" SERIAL NOT NULL,
    "type_name" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" SERIAL NOT NULL,
    "pattern_name" VARCHAR NOT NULL,
    "board_id" INTEGER NOT NULL,
    "standard_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "pattern_id" INTEGER NOT NULL,
    "seqencial_section_number" INTEGER NOT NULL,
    "sub_section" VARCHAR NOT NULL,
    "section_name" VARCHAR NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "mandotory_questions" INTEGER NOT NULL,
    "marks_per_question" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subsection_Question_Type" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "seqencial_subquestion_number" INTEGER NOT NULL,
    "question_type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Subsection_Question_Type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_pattern_id_seqencial_section_number_key" ON "Section"("pattern_id", "seqencial_section_number");

-- CreateIndex
CREATE UNIQUE INDEX "Subsection_Question_Type_section_id_seqencial_subquestion_n_key" ON "Subsection_Question_Type"("section_id", "seqencial_subquestion_number");

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsection_Question_Type" ADD CONSTRAINT "Subsection_Question_Type_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsection_Question_Type" ADD CONSTRAINT "Subsection_Question_Type_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "Question_Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraint to Section table
ALTER TABLE "Section" 
ADD CONSTRAINT "check_mandatory_questions" 
CHECK (mandotory_questions <= total_questions);
