-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "password" VARCHAR NOT NULL,
    "email_id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "contact_number" INTEGER NOT NULL,
    "alternate_contact_number" INTEGER,
    "highest_qualification" VARCHAR,
    "status" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Role" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_School" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medium_Standard_Subject" (
    "id" SERIAL NOT NULL,
    "instruction_medium_id" INTEGER NOT NULL,
    "standard_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Medium_Standard_Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher_Subject" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "school_standard_id" INTEGER NOT NULL,
    "medium_standard_subject_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Teacher_Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_id_key" ON "User"("email_id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_name_key" ON "Role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_Role_user_id_role_id_key" ON "User_Role"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_School_user_id_school_id_key" ON "User_School"("user_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "Medium_Standard_Subject_instruction_medium_id_standard_id_s_key" ON "Medium_Standard_Subject"("instruction_medium_id", "standard_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_Subject_user_id_school_standard_id_medium_standard__key" ON "Teacher_Subject"("user_id", "school_standard_id", "medium_standard_subject_id");

-- AddForeignKey
ALTER TABLE "User_Role" ADD CONSTRAINT "User_Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Role" ADD CONSTRAINT "User_Role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_School" ADD CONSTRAINT "User_School_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_School" ADD CONSTRAINT "User_School_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medium_Standard_Subject" ADD CONSTRAINT "Medium_Standard_Subject_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medium_Standard_Subject" ADD CONSTRAINT "Medium_Standard_Subject_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medium_Standard_Subject" ADD CONSTRAINT "Medium_Standard_Subject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_school_standard_id_fkey" FOREIGN KEY ("school_standard_id") REFERENCES "School_Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher_Subject" ADD CONSTRAINT "Teacher_Subject_medium_standard_subject_id_fkey" FOREIGN KEY ("medium_standard_subject_id") REFERENCES "Medium_Standard_Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
