-- Global exam languages (unique English / Hindi / Marathi / …)
-- Board Instruction_Medium stays board-scoped; exams use Language.

CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "instruction_medium_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");
CREATE UNIQUE INDEX "Language_instruction_medium_id_key" ON "Language"("instruction_medium_id");

ALTER TABLE "Instruction_Medium"
ADD COLUMN "language_id" INTEGER;

CREATE INDEX "Instruction_Medium_language_id_idx" ON "Instruction_Medium"("language_id");

ALTER TABLE "Language"
ADD CONSTRAINT "Language_instruction_medium_id_fkey"
FOREIGN KEY ("instruction_medium_id") REFERENCES "Instruction_Medium"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Instruction_Medium"
ADD CONSTRAINT "Instruction_Medium_language_id_fkey"
FOREIGN KEY ("language_id") REFERENCES "Language"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed canonical languages (mediums linked by app bootstrap / LanguageService)
INSERT INTO "Language" ("code", "name", "is_active", "sequence_number", "created_at", "updated_at")
VALUES
  ('EN', 'English', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('HI', 'Hindi', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MR', 'Marathi', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GU', 'Gujarati', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TA', 'Tamil', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TE', 'Telugu', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('KN', 'Kannada', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BN', 'Bengali', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('UR', 'Urdu', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Link existing board mediums to languages by name (case-insensitive)
UPDATE "Instruction_Medium" im
SET "language_id" = l.id
FROM "Language" l
WHERE lower(im."instruction_medium") = lower(l."name")
  AND im."language_id" IS NULL;
