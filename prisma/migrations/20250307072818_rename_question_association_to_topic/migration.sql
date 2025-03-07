/*
  Warnings:

  - You are about to drop the `Question_Association` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question_Association" DROP CONSTRAINT "Question_Association_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Question_Association" DROP CONSTRAINT "Question_Association_topic_id_fkey";

-- DropTable
DROP TABLE "Question_Association";

-- CreateTable
CREATE TABLE "Question_Topic" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_Topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_Topic_question_id_topic_id_key" ON "Question_Topic"("question_id", "topic_id");

-- AddForeignKey
ALTER TABLE "Question_Topic" ADD CONSTRAINT "Question_Topic_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Topic" ADD CONSTRAINT "Question_Topic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
