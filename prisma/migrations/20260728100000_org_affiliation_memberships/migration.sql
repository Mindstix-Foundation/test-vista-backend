-- Org affiliation: Institution org_code/visibility, memberships, User_Notification; drop User_School

-- Enums
CREATE TYPE "InstitutionVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "OrgMemberRole" AS ENUM ('ADMIN', 'TEACHER');
CREATE TYPE "OrgMembershipStatus" AS ENUM ('pending', 'active', 'rejected', 'left');

-- Ensure every School has an Institution (before org_code required)
INSERT INTO "Institution" (
  institution_type, name, email, contact_number, principal_name, is_active, school_id, created_at, updated_at
)
SELECT
  'SCHOOL'::"InstitutionType",
  s.name,
  s.email,
  s.contact_number,
  s.principal_name,
  true,
  s.id,
  NOW(),
  NOW()
FROM "School" s
WHERE NOT EXISTS (
  SELECT 1 FROM "Institution" i WHERE i.school_id = s.id
);

-- Add new Institution columns (org_code nullable first for backfill)
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "org_code" VARCHAR(32);
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "visibility" "InstitutionVisibility" NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMPTZ(6);
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "created_by_user_id" INTEGER;

-- Backfill org_code for existing rows
UPDATE "Institution"
SET "org_code" = 'TV-' || LPAD(id::text, 6, '0')
WHERE "org_code" IS NULL OR "org_code" = '';

ALTER TABLE "Institution" ALTER COLUMN "org_code" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Institution_org_code_key" ON "Institution"("org_code");
CREATE INDEX IF NOT EXISTS "Institution_visibility_is_active_idx" ON "Institution"("visibility", "is_active");
CREATE INDEX IF NOT EXISTS "Institution_institution_type_is_active_idx" ON "Institution"("institution_type", "is_active");

ALTER TABLE "Institution"
  DROP CONSTRAINT IF EXISTS "Institution_created_by_user_id_fkey";
ALTER TABLE "Institution"
  ADD CONSTRAINT "Institution_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Institution_Membership (teachers)
CREATE TABLE IF NOT EXISTS "Institution_Membership" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "institution_id" INTEGER NOT NULL,
  "member_role" "OrgMemberRole" NOT NULL DEFAULT 'TEACHER',
  "status" "OrgMembershipStatus" NOT NULL DEFAULT 'pending',
  "request_message" TEXT,
  "responded_by_user_id" INTEGER,
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "responded_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Institution_Membership_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Institution_Membership_institution_id_fkey"
    FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Institution_Membership_responded_by_user_id_fkey"
    FOREIGN KEY ("responded_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Institution_Membership_user_id_status_idx"
  ON "Institution_Membership"("user_id", "status");
CREATE INDEX IF NOT EXISTS "Institution_Membership_institution_id_status_idx"
  ON "Institution_Membership"("institution_id", "status");
CREATE INDEX IF NOT EXISTS "Institution_Membership_institution_id_member_role_status_idx"
  ON "Institution_Membership"("institution_id", "member_role", "status");

-- One pending/active membership per user (partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS "Institution_Membership_one_active_or_pending_per_user"
  ON "Institution_Membership"("user_id")
  WHERE "status" IN ('pending', 'active');

-- Learner_Institution_Membership
CREATE TABLE IF NOT EXISTS "Learner_Institution_Membership" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "institution_id" INTEGER NOT NULL,
  "student_id" INTEGER,
  "participant_id" INTEGER,
  "school_standard_id" INTEGER,
  "status" "OrgMembershipStatus" NOT NULL DEFAULT 'pending',
  "request_message" TEXT,
  "responded_by_user_id" INTEGER,
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "responded_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Learner_Institution_Membership_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Learner_Institution_Membership_institution_id_fkey"
    FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Learner_Institution_Membership_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Learner_Institution_Membership_participant_id_fkey"
    FOREIGN KEY ("participant_id") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Learner_Institution_Membership_school_standard_id_fkey"
    FOREIGN KEY ("school_standard_id") REFERENCES "School_Standard"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Learner_Institution_Membership_responded_by_user_id_fkey"
    FOREIGN KEY ("responded_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Learner_Institution_Membership_user_id_status_idx"
  ON "Learner_Institution_Membership"("user_id", "status");
CREATE INDEX IF NOT EXISTS "Learner_Institution_Membership_institution_id_status_idx"
  ON "Learner_Institution_Membership"("institution_id", "status");
CREATE INDEX IF NOT EXISTS "Learner_Institution_Membership_student_id_idx"
  ON "Learner_Institution_Membership"("student_id");
CREATE INDEX IF NOT EXISTS "Learner_Institution_Membership_participant_id_idx"
  ON "Learner_Institution_Membership"("participant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "Learner_Institution_Membership_one_active_or_pending_per_user"
  ON "Learner_Institution_Membership"("user_id")
  WHERE "status" IN ('pending', 'active');

-- User_Notification
CREATE TABLE IF NOT EXISTS "User_Notification" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "title" VARCHAR NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR NOT NULL,
  "priority" VARCHAR NOT NULL DEFAULT 'normal',
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "action_url" VARCHAR,
  "expires_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_Notification_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "User_Notification_user_id_is_read_idx"
  ON "User_Notification"("user_id", "is_read");

-- Migrate User_School → Institution_Membership (ADMIN, active)
INSERT INTO "Institution_Membership" (
  user_id, institution_id, member_role, status, requested_at, responded_at, created_at, updated_at
)
SELECT DISTINCT ON (us.user_id)
  us.user_id,
  i.id,
  'ADMIN'::"OrgMemberRole",
  'active'::"OrgMembershipStatus",
  COALESCE(us.start_date::timestamptz, NOW()),
  NOW(),
  COALESCE(us.created_at, NOW()),
  NOW()
FROM "User_School" us
JOIN "Institution" i ON i.school_id = us.school_id
WHERE NOT EXISTS (
  SELECT 1 FROM "Institution_Membership" im
  WHERE im.user_id = us.user_id AND im.status IN ('pending', 'active')
)
ORDER BY us.user_id, us.created_at DESC;

-- Migrate Students → Learner_Institution_Membership (active)
INSERT INTO "Learner_Institution_Membership" (
  user_id, institution_id, student_id, school_standard_id, status, requested_at, responded_at, created_at, updated_at
)
SELECT
  st.user_id,
  i.id,
  st.id,
  st.school_standard_id,
  'active'::"OrgMembershipStatus",
  COALESCE(st.enrollment_date::timestamptz, st.created_at, NOW()),
  NOW(),
  COALESCE(st.created_at, NOW()),
  NOW()
FROM "Student" st
JOIN "School_Standard" ss ON ss.id = st.school_standard_id
JOIN "Institution" i ON i.school_id = ss.school_id
WHERE NOT EXISTS (
  SELECT 1 FROM "Learner_Institution_Membership" lim
  WHERE lim.user_id = st.user_id AND lim.status IN ('pending', 'active')
);

-- Drop legacy User_School
DROP TABLE IF EXISTS "User_School";
