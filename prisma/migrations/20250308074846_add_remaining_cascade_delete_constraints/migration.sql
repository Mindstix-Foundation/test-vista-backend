-- DropForeignKey
ALTER TABLE "Question_Topic" DROP CONSTRAINT "Question_Topic_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Question_Topic" DROP CONSTRAINT "Question_Topic_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Chapter" DROP CONSTRAINT "Test_Paper_Chapter_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Chapter" DROP CONSTRAINT "Test_Paper_Chapter_test_paper_id_fkey";

-- AddForeignKey
ALTER TABLE "Question_Topic" ADD CONSTRAINT "Question_Topic_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Topic" ADD CONSTRAINT "Question_Topic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Chapter" ADD CONSTRAINT "Test_Paper_Chapter_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Chapter" ADD CONSTRAINT "Test_Paper_Chapter_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
