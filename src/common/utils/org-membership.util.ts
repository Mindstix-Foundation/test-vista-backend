import { randomBytes } from 'node:crypto';

import { OrgMembershipStatus } from '../../generated/prisma/client';

export {
  OrgMembershipStatus,
  OrgMemberRole,
  InstitutionVisibility,
  InstitutionType,
} from '../../generated/prisma/client';

/** Active teacher membership include shape used across services */
export const activeTeacherMembershipInclude = {
  institution: {
    include: {
      school: {
        include: {
          board: true,
        },
      },
    },
  },
} as const;

export function activeMembershipWhere(userId: number) {
  return {
    user_id: userId,
    status: OrgMembershipStatus.active,
  };
}

/**
 * Resolve school_id from an active Institution_Membership (via Institution.school_id).
 */
export function schoolIdFromMembership(membership: {
  institution?: { school_id?: number | null; school?: { id: number } | null } | null;
} | null): number | null {
  if (!membership?.institution) return null;
  if (membership.institution.school_id != null) return membership.institution.school_id;
  if (membership.institution.school?.id != null) return membership.institution.school.id;
  return null;
}

/** Generate a unique-ish org_code (DB unique constraint is the final guard). */
export function generateOrgCode(prefix = 'TV'): string {
  const rand = randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Teacher-assigned features require an active learner membership.
 * Legacy students (active status, no membership row) remain allowed until fully migrated.
 */
export function learnerCanAccessTeacherFeatures(opts: {
  studentStatus?: string | null;
  membershipStatus?: OrgMembershipStatus | null;
}): boolean {
  if (opts.membershipStatus === OrgMembershipStatus.pending) return false;
  if (opts.membershipStatus === OrgMembershipStatus.active) return true;
  if (opts.membershipStatus === OrgMembershipStatus.rejected) return false;
  if (opts.membershipStatus === OrgMembershipStatus.left) return false;
  // No membership row: fall back to Student.status
  return (opts.studentStatus || '').toLowerCase() === 'active';
}

/** Academic year label for auto L2 enrollments (e.g. 2025-26). */
export function currentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based; April+ → new year
  if (month >= 3) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}
