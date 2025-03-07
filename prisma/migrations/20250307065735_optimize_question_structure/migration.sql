/*
  Warnings:

  - You are about to drop the column `topic_id` on the `Question_Text` table. All the data in the column will be lost.
  - You are about to drop the `Unverified_Question` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question_Text" DROP CONSTRAINT "Question_Text_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "Unverified_Question" DROP CONSTRAINT "Unverified_Question_image_id_fkey";

-- DropForeignKey
ALTER TABLE "Unverified_Question" DROP CONSTRAINT "Unverified_Question_question_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Unverified_Question" DROP CONSTRAINT "Unverified_Question_topic_id_fkey";

-- DropIndex
DROP INDEX "Topic_chapter_id_sequential_topic_number_key";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question_Text" DROP COLUMN "topic_id";

-- DropTable
DROP TABLE "Unverified_Question";

-- CreateTable
CREATE TABLE "Question_Association" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_Association_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_Association_question_id_topic_id_key" ON "Question_Association"("question_id", "topic_id");

-- AddForeignKey
ALTER TABLE "Question_Association" ADD CONSTRAINT "Question_Association_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Association" ADD CONSTRAINT "Question_Association_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
