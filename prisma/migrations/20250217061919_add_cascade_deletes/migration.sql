-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_city_id_fkey";

-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_medium_standard_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "City" DROP CONSTRAINT "City_state_id_fkey";

-- DropForeignKey
ALTER TABLE "Instruction_Medium" DROP CONSTRAINT "Instruction_Medium_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Medium_Standard_Subject" DROP CONSTRAINT "Medium_Standard_Subject_instruction_medium_id_fkey";

-- DropForeignKey
ALTER TABLE "Medium_Standard_Subject" DROP CONSTRAINT "Medium_Standard_Subject_standard_id_fkey";

-- DropForeignKey
ALTER TABLE "Medium_Standard_Subject" DROP CONSTRAINT "Medium_Standard_Subject_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_address_id_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_board_id_fkey";

-- DropForeignKey
ALTER TABLE "School_Instruction_Medium" DROP CONSTRAINT "School_Instruction_Medium_instruction_medium_id_fkey";

-- DropForeignKey
ALTER TABLE "School_Instruction_Medium" DROP CONSTRAINT "School_Instruction_Medium_school_id_fkey";

-- DropForeignKey
ALTER TABLE "School_Standard" DROP CONSTRAINT "School_Standard_school_id_fkey";

-- DropForeignKey
ALTER TABLE "School_Standard" DROP CONSTRAINT "School_Standard_standard_id_fkey";

-- DropForeignKey
ALTER TABLE "Standard" DROP CONSTRAINT "Standard_board_id_fkey";

-- DropForeignKey
ALTER TABLE "State" DROP CONSTRAINT "State_country_id_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_board_id_fkey";

-- DropForeignKey
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_medium_standard_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_school_standard_id_fkey";

-- DropForeignKey
ALTER TABLE "Teacher_Subject" DROP CONSTRAINT "Teacher_Subject_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Topic" DROP CONSTRAINT "Topic_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "User_Role" DROP CONSTRAINT "User_Role_role_id_fkey";

-- DropForeignKey
ALTER TABLE "User_Role" DROP CONSTRAINT "User_Role_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User_School" DROP CONSTRAINT "User_School_school_id_fkey";

-- DropForeignKey
ALTER TABLE "User_School" DROP CONSTRAINT "User_School_user_id_fkey";

-- DropForeignKey
ALTER TABLE "boards" DROP CONSTRAINT "boards_address_id_fkey";

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction_Medium" ADD CONSTRAINT "Instruction_Medium_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Instruction_Medium" ADD CONSTRAINT "School_Instruction_Medium_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Instruction_Medium" ADD CONSTRAINT "School_Instruction_Medium_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Standard" ADD CONSTRAINT "School_Standard_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Standard" ADD CONSTRAINT "School_Standard_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Role" ADD CONSTRAINT "User_Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Role" ADD CONSTRAINT "User_Role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_School" ADD CONSTRAINT "User_School_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_School" ADD CONSTRAINT "User_School_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medium_Standard_Subject" ADD CONSTRAINT "Medium_Standard_Subject_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medium_Standard_Subject" ADD CONSTRAINT "Medium_Standard_Subject_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medium_Standard_Subject" ADD CONSTRAINT "Medium_Standard_Subject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_school_standard_id_fkey" FOREIGN KEY ("school_standard_id") REFERENCES "School_Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_medium_standard_subject_id_fkey" FOREIGN KEY ("medium_standard_subject_id") REFERENCES "Medium_Standard_Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_medium_standard_subject_id_fkey" FOREIGN KEY ("medium_standard_subject_id") REFERENCES "Medium_Standard_Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
