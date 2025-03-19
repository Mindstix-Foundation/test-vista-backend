/*
  Warnings:

  - Added the required column `file_size` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_type` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_filename` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "file_size" INTEGER NOT NULL,
ADD COLUMN     "file_type" VARCHAR NOT NULL,
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "original_filename" VARCHAR NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;
