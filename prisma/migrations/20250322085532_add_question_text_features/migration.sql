/*
  Warnings:

  - You are about to drop the column `instruction_medium_id` on the `Question_Text` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `Question_Text` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question_Text" DROP CONSTRAINT "Question_Text_instruction_medium_id_fkey";

-- AlterTable
ALTER TABLE "Question_Text" DROP COLUMN "instruction_medium_id",
DROP COLUMN "is_verified";

-- CreateTable
CREATE TABLE "Question_Text_Topic_Medium" (
    "id" SERIAL NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "question_topic_id" INTEGER NOT NULL,
    "instruction_medium_id" INTEGER NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_Text_Topic_Medium_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_Text_Topic_Medium_question_text_id_question_topic__key" ON "Question_Text_Topic_Medium"("question_text_id", "question_topic_id", "instruction_medium_id");

-- AddForeignKey
ALTER TABLE "Question_Text_Topic_Medium" ADD CONSTRAINT "Question_Text_Topic_Medium_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text_Topic_Medium" ADD CONSTRAINT "Question_Text_Topic_Medium_question_topic_id_fkey" FOREIGN KEY ("question_topic_id") REFERENCES "Question_Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text_Topic_Medium" ADD CONSTRAINT "Question_Text_Topic_Medium_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;
