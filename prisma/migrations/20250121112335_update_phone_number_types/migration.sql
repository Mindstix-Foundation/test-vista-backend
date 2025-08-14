-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "board_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "address_id" INTEGER NOT NULL,
    "principal_name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "contact_number" INTEGER NOT NULL,
    "alternate_contact_number" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School_Instruction_Medium" (
    "id" SERIAL NOT NULL,
    "instruction_medium_id" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "School_Instruction_Medium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School_Standard" (
    "id" SERIAL NOT NULL,
    "standard_id" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "School_Standard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_address_id_key" ON "School"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "School_Instruction_Medium_school_id_key" ON "School_Instruction_Medium"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "School_Standard_school_id_key" ON "School_Standard"("school_id");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Instruction_Medium" ADD CONSTRAINT "School_Instruction_Medium_instruction_medium_id_fkey" FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Instruction_Medium" ADD CONSTRAINT "School_Instruction_Medium_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Standard" ADD CONSTRAINT "School_Standard_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "Standard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School_Standard" ADD CONSTRAINT "School_Standard_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
