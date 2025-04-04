/*
  Warnings:

  - You are about to drop the column `medium_standard_subject_id` on the `Teacher_Subject` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,school_standard_id,subject_id]` on the table `Teacher_Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subject_id` to the `Teacher_Subject` table without a default value. This is not possible if the table is not empty.

*/
-- Create a temporary table to hold the current data with subject_id
CREATE TABLE "Teacher_Subject_Temp" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "school_standard_id" INTEGER NOT NULL,
  "subject_id" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Teacher_Subject_Temp_pkey" PRIMARY KEY ("id")
);

-- Copy data from Teacher_Subject to temporary table, joining with Medium_Standard_Subject to get subject_id
INSERT INTO "Teacher_Subject_Temp" ("id", "user_id", "school_standard_id", "subject_id", "created_at", "updated_at")
SELECT ts."id", ts."user_id", ts."school_standard_id", mss."subject_id", ts."created_at", ts."updated_at"
FROM "Teacher_Subject" ts
JOIN "Medium_Standard_Subject" mss ON ts."medium_standard_subject_id" = mss."id";

-- Drop the old table and constraints
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_pkey";
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_medium_standard_subject_id_fkey";
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_school_standard_id_fkey";
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_user_id_fkey";
DROP INDEX "Teacher_Subject_user_id_school_standard_id_medium_standard__key";
DROP TABLE "Teacher_Subject";

-- Rename the temporary table to the original table name
ALTER TABLE "Teacher_Subject_Temp" RENAME TO "Teacher_Subject";

-- Create the new unique constraint
CREATE UNIQUE INDEX "Teacher_Subject_user_id_school_standard_id_subject_id_key" ON "Teacher_Subject"("user_id", "school_standard_id", "subject_id");

-- Add foreign key constraints
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_school_standard_id_fkey" FOREIGN KEY ("school_standard_id") REFERENCES "School_Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
