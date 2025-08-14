/*
  Warnings:

  - A unique constraint covering the columns `[medium_standard_subject_id,sequential_chapter_number]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chapter_id,sequential_topic_number]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chapter_medium_standard_subject_id_sequential_chapter_numbe_key" ON "Chapter"("medium_standard_subject_id", "sequential_chapter_number");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_chapter_id_sequential_topic_number_key" ON "Topic"("chapter_id", "sequential_topic_number");
