-- DropForeignKey
ALTER TABLE "Match_Pair" DROP CONSTRAINT "Match_Pair_question_text_id_fkey";

-- DropForeignKey
ALTER TABLE "Mcq_Option" DROP CONSTRAINT "Mcq_Option_question_text_id_fkey";

-- DropForeignKey
ALTER TABLE "Password_Reset" DROP CONSTRAINT "Password_Reset_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_question_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Question_Text" DROP CONSTRAINT "Question_Text_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper" DROP CONSTRAINT "Test_Paper_medium_standard_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper" DROP CONSTRAINT "Test_Paper_pattern_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Question" DROP CONSTRAINT "Test_Paper_Question_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Question" DROP CONSTRAINT "Test_Paper_Question_section_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Question" DROP CONSTRAINT "Test_Paper_Question_test_paper_id_fkey";

-- AddForeignKey
ALTER TABLE "Password_Reset" ADD CONSTRAINT "Password_Reset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "Question_Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text" ADD CONSTRAINT "Question_Text_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mcq_Option" ADD CONSTRAINT "Mcq_Option_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match_Pair" ADD CONSTRAINT "Match_Pair_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_medium_standard_subject_id_fkey" FOREIGN KEY ("medium_standard_subject_id") REFERENCES "Medium_Standard_Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
