-- CreateTable
CREATE TABLE "Test_Paper_Question" (
    "id" SERIAL NOT NULL,
    "test_paper_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "subsection_id" INTEGER NOT NULL,
    "question_order" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_Paper_Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Test_Paper_Question_test_paper_id_section_id_question_order_idx" ON "Test_Paper_Question"("test_paper_id", "section_id", "question_order");

-- CreateIndex
CREATE UNIQUE INDEX "Test_Paper_Question_test_paper_id_question_id_question_text_key" ON "Test_Paper_Question"("test_paper_id", "question_id", "question_text_id");

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;
