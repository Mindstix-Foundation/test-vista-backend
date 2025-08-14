/*
  Warnings:

  - You are about to drop the column `medium_standard_subject_id` on the `Test_Paper` table. All the data in the column will be lost.
  - You are about to drop the `Test_Paper_Question` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `school_id` to the `Test_Paper` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Test_Paper` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Test_Paper` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Test_Paper" DROP CONSTRAINT "Test_Paper_medium_standard_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Question" DROP CONSTRAINT "Test_Paper_Question_question_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Question" DROP CONSTRAINT "Test_Paper_Question_section_id_fkey";

-- DropForeignKey
ALTER TABLE "Test_Paper_Question" DROP CONSTRAINT "Test_Paper_Question_test_paper_id_fkey";

-- AlterTable
ALTER TABLE "Test_Paper" DROP COLUMN "medium_standard_subject_id",
ADD COLUMN     "school_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "test_paper_origin_id" DROP NOT NULL;

-- DropTable
DROP TABLE "Test_Paper_Question";

-- CreateTable
CREATE TABLE "HTML_File" (
    "id" SERIAL NOT NULL,
    "test_paper_id" INTEGER NOT NULL,
    "content_url" VARCHAR NOT NULL,
    "instruction_medium_id" INTEGER NOT NULL,
    "is_default_medium" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "file_size" INTEGER,
    "is_pdf" BOOLEAN NOT NULL DEFAULT false,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "HTML_File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HTML_File_test_paper_id_instruction_medium_id_key" ON "HTML_File"("test_paper_id", "instruction_medium_id");

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HTML_File" ADD CONSTRAINT "HTML_File_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HTML_File" ADD CONSTRAINT "HTML_File_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;
