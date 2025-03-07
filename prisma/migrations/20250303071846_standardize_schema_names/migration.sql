/*
  Warnings:

  - You are about to drop the `PasswordReset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blacklisted_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `boards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Instruction_Medium" DROP CONSTRAINT "Instruction_Medium_board_id_fkey";

-- DropForeignKey
ALTER TABLE "PasswordReset" DROP CONSTRAINT "PasswordReset_userId_fkey";

-- DropForeignKey
ALTER TABLE "Pattern" DROP CONSTRAINT "Pattern_board_id_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Standard" DROP CONSTRAINT "Standard_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User_Role" DROP CONSTRAINT "User_Role_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User_School" DROP CONSTRAINT "User_School_user_id_fkey";

-- DropForeignKey
ALTER TABLE "boards" DROP CONSTRAINT "boards_address_id_fkey";

-- AlterTable
ALTER TABLE "Chapter" ALTER COLUMN "name" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "Topic" ALTER COLUMN "name" SET DATA TYPE VARCHAR;

-- DropTable
DROP TABLE "PasswordReset";

-- DropTable
DROP TABLE "blacklisted_tokens";

-- DropTable
DROP TABLE "boards";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "abbreviation" VARCHAR NOT NULL,
    "address_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email_id" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "contact_number" VARCHAR NOT NULL,
    "alternate_contact_number" VARCHAR,
    "highest_qualification" VARCHAR,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklisted_Token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blacklisted_Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Password_Reset" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Password_Reset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "image_url" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "question_type_id" INTEGER NOT NULL,
    "board_question" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question_Text" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "image_id" INTEGER,
    "question_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Question_Text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unverified_Question" (
    "id" SERIAL NOT NULL,
    "question_type_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "image_id" INTEGER,
    "question_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Unverified_Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mcq_Option" (
    "id" SERIAL NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "option_text" VARCHAR,
    "image_id" INTEGER,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Mcq_Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match_Pair" (
    "id" SERIAL NOT NULL,
    "question_text_id" INTEGER NOT NULL,
    "left_text" VARCHAR,
    "right_text" VARCHAR,
    "left_image_id" INTEGER,
    "right_image_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Match_Pair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Paper" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "exam_time" TIME NOT NULL,
    "medium_standard_subject_id" INTEGER NOT NULL,
    "pattern_id" INTEGER NOT NULL,
    "test_paper_origin_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Paper_Chapter" (
    "id" SERIAL NOT NULL,
    "test_paper_id" INTEGER NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "weightage" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_Paper_Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Paper_Question" (
    "id" SERIAL NOT NULL,
    "test_paper_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,

    CONSTRAINT "Test_Paper_Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_name_key" ON "Board"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Board_abbreviation_key" ON "Board"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Board_address_id_key" ON "Board"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_id_key" ON "User"("email_id");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklisted_Token_token_key" ON "Blacklisted_Token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Password_Reset_token_key" ON "Password_Reset"("token");

-- CreateIndex
CREATE INDEX "Password_Reset_token_idx" ON "Password_Reset"("token");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction_Medium" ADD CONSTRAINT "Instruction_Medium_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Role" ADD CONSTRAINT "User_Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_School" ADD CONSTRAINT "User_School_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Password_Reset" ADD CONSTRAINT "Password_Reset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "Question_Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text" ADD CONSTRAINT "Question_Text_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text" ADD CONSTRAINT "Question_Text_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question_Text" ADD CONSTRAINT "Question_Text_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unverified_Question" ADD CONSTRAINT "Unverified_Question_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "Question_Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unverified_Question" ADD CONSTRAINT "Unverified_Question_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unverified_Question" ADD CONSTRAINT "Unverified_Question_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mcq_Option" ADD CONSTRAINT "Mcq_Option_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mcq_Option" ADD CONSTRAINT "Mcq_Option_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match_Pair" ADD CONSTRAINT "Match_Pair_question_text_id_fkey" FOREIGN KEY ("question_text_id") REFERENCES "Question_Text"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match_Pair" ADD CONSTRAINT "Match_Pair_left_image_id_fkey" FOREIGN KEY ("left_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match_Pair" ADD CONSTRAINT "Match_Pair_right_image_id_fkey" FOREIGN KEY ("right_image_id") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_medium_standard_subject_id_fkey" FOREIGN KEY ("medium_standard_subject_id") REFERENCES "Medium_Standard_Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper" ADD CONSTRAINT "Test_Paper_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "Pattern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Chapter" ADD CONSTRAINT "Test_Paper_Chapter_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Chapter" ADD CONSTRAINT "Test_Paper_Chapter_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "Test_Paper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Paper_Question" ADD CONSTRAINT "Test_Paper_Question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
