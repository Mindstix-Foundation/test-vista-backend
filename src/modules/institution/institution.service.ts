import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  UpdateOrgVisibilityDto,
  CreateCohortDto,
  InstitutionFilterDto,
  InstitutionTypeDto,
} from './dto/institution.dto';
import { CreateTeacherOrgDto } from './dto/create-teacher-org.dto';
import { CsvInviteDto, CsvInviteRowDto, InviteRoleDto } from './dto/csv-invite.dto';
import {
  generateOrgCode,
  InstitutionVisibility,
  InstitutionType,
  OrgMemberRole,
  OrgMembershipStatus,
  currentAcademicYear,
} from '../../common/utils/org-membership.util';
import { toTitleCase } from '../../utils/titleCase';
import { NotificationService } from '../notification/notification.service';
import * as bcrypt from 'bcrypt';

const OPEN_LEARNING_BOARD_ABBR = 'TV-OPEN';
const OPEN_LEARNING_SCHOOL_NAME = 'Test Vista Open Learning';

interface LearnerCsvInviteRowParams {
  email: string;
  name: string;
  row: CsvInviteRowDto;
  institution: any;
  openSchoolStandardId: number | null;
  openInstitutionId: number | null;
  coachingSchoolStandard: { id: number } | null;
  hashedPassword: string;
}

@Injectable()
export class InstitutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  private inviteTempPassword(): string {
    const value = this.configService.get<string>('INVITE_TEMP_PASSWORD');
    if (!value) {
      throw new BadRequestException('INVITE_TEMP_PASSWORD is not configured');
    }
    return value;
  }

  async findAll(filter: InstitutionFilterDto) {
    return this.prisma.institution.findMany({
      where: {
        is_active: true,
        ...(filter.institution_type ? { institution_type: filter.institution_type as any } : {}),
        ...(filter.visibility ? { visibility: filter.visibility as any } : {}),
        ...(filter.exam_program_id
          ? { institution_programs: { some: { exam_program_id: filter.exam_program_id } } }
          : {}),
        ...(filter.org_code ? { org_code: filter.org_code } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        school: { select: { id: true, name: true, board_id: true } },
        institution_programs: { include: { exam_program: { include: { exam_body: true } } } },
        _count: { select: { participants: true, exam_cohorts: true, memberships: true } },
      },
    });
  }

  async findOne(id: number) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        school: true,
        institution_programs: { include: { exam_program: { include: { exam_body: true } } } },
        exam_cohorts: { include: { _count: { select: { participants: true } } } },
        memberships: {
          where: { status: 'active' },
          include: { user: { select: { id: true, name: true, email_id: true } } },
        },
        _count: { select: { participants: true, memberships: true } },
      },
    });
    if (!institution) throw new NotFoundException(`Institution ${id} not found`);
    return institution;
  }

  async findByOrgCode(orgCode: string) {
    const institution =
      (await this.prisma.institution.findUnique({
        where: { org_code: orgCode.trim() },
        include: {
          school: { select: { id: true, name: true, board_id: true } },
        },
      })) ||
      (await this.prisma.institution.findFirst({
        where: { org_code: { equals: orgCode.trim(), mode: 'insensitive' } },
        include: {
          school: { select: { id: true, name: true, board_id: true } },
        },
      }));
    if (!institution?.is_active) {
      throw new NotFoundException(`Institution with code ${orgCode} not found`);
    }
    return institution;
  }

  async create(dto: CreateInstitutionDto) {
    const { exam_program_ids, ...data } = dto;
    return this.prisma.institution.create({
      data: {
        ...data,
        institution_type: data.institution_type as any,
        org_code: generateOrgCode(),
        visibility: data.visibility ?? InstitutionVisibility.PRIVATE,
        institution_programs: exam_program_ids?.length
          ? { create: exam_program_ids.map((id) => ({ exam_program_id: id })) }
          : undefined,
      },
      include: { institution_programs: { include: { exam_program: true } } },
    });
  }

  /**
   * Teacher self-serve: create School or Coaching Center.
   * Always creates linked School (curriculum) + Institution + ADMIN membership.
   */
  async createForTeacher(userId: number, dto: CreateTeacherOrgDto) {
    if (
      dto.institution_type !== InstitutionTypeDto.SCHOOL &&
      dto.institution_type !== InstitutionTypeDto.COACHING_CENTER
    ) {
      throw new BadRequestException('institution_type must be SCHOOL or COACHING_CENTER');
    }

    const existingMembership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'You already belong to (or have a pending request for) an organization. Leave it before creating another.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const board = await this.prisma.board.findUnique({ where: { id: dto.board_id } });
    if (!board) throw new NotFoundException(`Board ${dto.board_id} not found`);

    const standards = await this.prisma.standard.findMany({
      where: { id: { in: dto.standard_ids }, board_id: dto.board_id },
    });
    if (standards.length !== dto.standard_ids.length) {
      throw new BadRequestException('One or more standards are invalid for the selected board');
    }

    const mediums = await this.prisma.instruction_Medium.findMany({
      where: { id: { in: dto.instruction_medium_ids }, board_id: dto.board_id },
    });
    if (mediums.length !== dto.instruction_medium_ids.length) {
      throw new BadRequestException(
        'One or more instruction mediums are invalid for the selected board',
      );
    }

    const city = await this.prisma.city.findUnique({ where: { id: dto.address.city_id } });
    if (!city) throw new NotFoundException(`City ${dto.address.city_id} not found`);

    const principalName = toTitleCase(dto.principal_name?.trim() || user.name);
    const email = (dto.email?.trim() || user.email_id).toLowerCase();
    const contact = dto.contact_number?.trim() || user.contact_number;
    const orgName = toTitleCase(dto.name.trim());
    const visibility =
      (dto.visibility as InstitutionVisibility | undefined) ?? InstitutionVisibility.PRIVATE;
    const institutionType =
      dto.institution_type === InstitutionTypeDto.COACHING_CENTER
        ? InstitutionType.COACHING_CENTER
        : InstitutionType.SCHOOL;

    const result = await this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          street: dto.address.street.trim(),
          postal_code: dto.address.postal_code.trim(),
          city_id: dto.address.city_id,
        },
      });

      const school = await tx.school.create({
        data: {
          name: orgName,
          board_id: dto.board_id,
          address_id: address.id,
          principal_name: principalName,
          email,
          contact_number: contact,
          alternate_contact_number: dto.alternate_contact_number?.trim() || null,
        },
      });

      await tx.school_Instruction_Medium.createMany({
        data: dto.instruction_medium_ids.map((instruction_medium_id) => ({
          school_id: school.id,
          instruction_medium_id,
        })),
      });

      await tx.school_Standard.createMany({
        data: dto.standard_ids.map((standard_id) => ({
          school_id: school.id,
          standard_id,
        })),
      });

      const institution = await tx.institution.create({
        data: {
          institution_type: institutionType,
          name: orgName,
          email,
          contact_number: contact,
          principal_name: principalName,
          org_code: generateOrgCode(institutionType === InstitutionType.COACHING_CENTER ? 'TV-C' : 'TV-S'),
          visibility,
          school_id: school.id,
          created_by_user_id: userId,
          is_active: true,
        },
      });

      const now = new Date();
      const membership = await tx.institution_Membership.create({
        data: {
          user_id: userId,
          institution_id: institution.id,
          member_role: OrgMemberRole.ADMIN,
          status: OrgMembershipStatus.active,
          requested_at: now,
          responded_at: now,
          responded_by_user_id: userId,
        },
      });

      return { institution, school, membership };
    });

    await this.mapCurriculumScopeToTeacherSubjects(userId, result.school.id);

    return {
      message: `${institutionType === InstitutionType.COACHING_CENTER ? 'Coaching center' : 'School'} created successfully. You are the organization admin.`,
      institution: {
        id: result.institution.id,
        name: result.institution.name,
        org_code: result.institution.org_code,
        institution_type: result.institution.institution_type,
        visibility: result.institution.visibility,
        school_id: result.school.id,
        member_role: result.membership.member_role,
      },
      school: {
        id: result.school.id,
        name: result.school.name,
        board_id: result.school.board_id,
      },
    };
  }

  /**
   * Upsert Teacher_Subject rows from the teacher's free curriculum scope
   * onto matching School_Standard rows for the given school.
   */
  async mapCurriculumScopeToTeacherSubjects(userId: number, schoolId: number) {
    const scopes = await this.prisma.teacher_Curriculum_Scope.findMany({
      where: { user_id: userId },
    });
    if (!scopes.length) return { created: 0 };

    const schoolStandards = await this.prisma.school_Standard.findMany({
      where: { school_id: schoolId },
    });
    const ssByStandardId = new Map(schoolStandards.map((ss) => [ss.standard_id, ss]));

    let created = 0;
    for (const scope of scopes) {
      const ss = ssByStandardId.get(scope.standard_id);
      if (!ss) continue;
      const existing = await this.prisma.teacher_Subject.findUnique({
        where: {
          user_id_school_standard_id_subject_id: {
            user_id: userId,
            school_standard_id: ss.id,
            subject_id: scope.subject_id,
          },
        },
      });
      if (existing) continue;
      await this.prisma.teacher_Subject.create({
        data: {
          user_id: userId,
          school_standard_id: ss.id,
          subject_id: scope.subject_id,
        },
      });
      created += 1;
    }
    return { created };
  }

  async update(id: number, dto: UpdateInstitutionDto) {
    await this.findOne(id);
    return this.prisma.institution.update({ where: { id }, data: dto as any });
  }

  /** Soft-close org (plan D22): deactivate, stamp closed_at; cascade memberships + notify. */
  async softClose(id: number, actorUserId?: number) {
    const institution = await this.findOne(id);
    if (!institution.is_active) {
      return {
        message: 'Organization is already soft-closed.',
        institution_id: id,
        teachers_released: 0,
        learners_released: 0,
      };
    }

    // Active + pending must both release so members can rejoin elsewhere (D16/D24/D31)
    const openStatuses = [OrgMembershipStatus.active, OrgMembershipStatus.pending];
    const teacherMemberships = await this.prisma.institution_Membership.findMany({
      where: { institution_id: id, status: { in: openStatuses } },
      select: { id: true, user_id: true },
    });
    const learnerMemberships = await this.prisma.learner_Institution_Membership.findMany({
      where: { institution_id: id, status: { in: openStatuses } },
      select: { id: true, user_id: true, student_id: true },
    });

    const studentIds = learnerMemberships
      .map((m) => m.student_id)
      .filter((x): x is number => x != null);

    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id },
        data: { is_active: false, closed_at: new Date() },
      });

      if (teacherMemberships.length) {
        await tx.institution_Membership.updateMany({
          where: { institution_id: id, status: { in: openStatuses } },
          data: {
            status: OrgMembershipStatus.left,
            responded_at: new Date(),
            ...(actorUserId ? { responded_by_user_id: actorUserId } : {}),
          },
        });
      }

      if (learnerMemberships.length) {
        await tx.learner_Institution_Membership.updateMany({
          where: { institution_id: id, status: { in: openStatuses } },
          data: {
            status: OrgMembershipStatus.left,
            responded_at: new Date(),
            ...(actorUserId ? { responded_by_user_id: actorUserId } : {}),
          },
        });
      }

      if (studentIds.length) {
        await tx.student_Subject_Enrollment.updateMany({
          where: {
            student_id: { in: studentIds },
            status: { in: ['approved', 'active', 'pending'] },
          },
          data: { status: 'inactive' },
        });

        await tx.test_Assignment.updateMany({
          where: {
            student_id: { in: studentIds },
            status: { notIn: ['completed', 'cancelled'] },
            NOT: { assignment_source: 'SELF_SMART' },
          },
          data: { status: 'cancelled' },
        });

        await tx.student.updateMany({
          where: { id: { in: studentIds } },
          data: { status: 'inactive' },
        });

        // Aspirants keep self-practice: restore active Student if ASPIRANT row remains
        const aspirantStudents = await tx.participant.findMany({
          where: {
            participant_type: 'ASPIRANT',
            status: 'active',
            student_id: { in: studentIds },
          },
          select: { student_id: true },
        });
        const keepActive = aspirantStudents
          .map((p) => p.student_id)
          .filter((x): x is number => x != null);
        if (keepActive.length) {
          await tx.student.updateMany({
            where: { id: { in: keepActive } },
            data: { status: 'active' },
          });
        }
      }

      await tx.participant.updateMany({
        where: {
          institution_id: id,
          participant_type: 'INSTITUTE_STUDENT',
          status: 'active',
        },
        data: { status: 'inactive', institution_id: null },
      });
    });

    const notifyIds = [
      ...teacherMemberships.map((m) => m.user_id),
      ...learnerMemberships.map((m) => m.user_id),
    ];
    await this.notifications.notifyUsers(notifyIds, {
      title: 'Organization closed',
      message: `${institution.name} has been soft-closed. You can join another School / Coaching Center. Your papers and completed results are kept.`,
      type: 'org_soft_close',
      action_url: '/login',
    });

    return {
      message: 'Organization soft-closed. Members notified and released to join elsewhere.',
      institution_id: id,
      teachers_released: teacherMemberships.length,
      learners_released: learnerMemberships.length,
    };
  }

  async remove(id: number) {
    return this.softClose(id);
  }

  async softCloseForOrgAdmin(actorUserId: number, institutionId: number) {
    await this.assertOrgAdmin(actorUserId, institutionId);
    return this.softClose(institutionId, actorUserId);
  }

  /** Org-admin teacher: PUBLIC (discoverable) ↔ PRIVATE (org-code join only). */
  async updateVisibilityForOrgAdmin(
    actorUserId: number,
    institutionId: number,
    dto: UpdateOrgVisibilityDto,
  ) {
    await this.assertOrgAdmin(actorUserId, institutionId);

    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution?.is_active) {
      throw new NotFoundException('Organization not found or is soft-closed');
    }

    const visibility =
      dto.visibility === InstitutionVisibility.PUBLIC
        ? InstitutionVisibility.PUBLIC
        : InstitutionVisibility.PRIVATE;

    if (institution.visibility === visibility) {
      return {
        message: `Organization is already ${visibility}.`,
        institution: {
          id: institution.id,
          name: institution.name,
          visibility: institution.visibility,
          org_code: institution.org_code,
        },
      };
    }

    const updated = await this.prisma.institution.update({
      where: { id: institutionId },
      data: { visibility },
      select: {
        id: true,
        name: true,
        visibility: true,
        org_code: true,
        institution_type: true,
      },
    });

    return {
      message:
        visibility === InstitutionVisibility.PUBLIC
          ? 'Organization is now public. Teachers and learners can find it when browsing.'
          : 'Organization is now private. Join requires the org code.',
      institution: updated,
    };
  }

  /**
   * Hard-delete org: release members (accounts kept), detach test papers (SetNull),
   * notify connected teachers + learners, then remove Institution row.
   */
  async hardDelete(id: number, actorUserId?: number) {
    const institution = await this.findOne(id);

    const openStatuses = [OrgMembershipStatus.active, OrgMembershipStatus.pending];
    const teacherMemberships = await this.prisma.institution_Membership.findMany({
      where: { institution_id: id, status: { in: openStatuses } },
      select: { id: true, user_id: true },
    });
    const learnerMemberships = await this.prisma.learner_Institution_Membership.findMany({
      where: { institution_id: id, status: { in: openStatuses } },
      select: { id: true, user_id: true, student_id: true },
    });

    const studentIds = learnerMemberships
      .map((m) => m.student_id)
      .filter((x): x is number => x != null);

    await this.prisma.$transaction(async (tx) => {
      if (teacherMemberships.length) {
        await tx.institution_Membership.updateMany({
          where: { institution_id: id, status: { in: openStatuses } },
          data: {
            status: OrgMembershipStatus.left,
            responded_at: new Date(),
            ...(actorUserId ? { responded_by_user_id: actorUserId } : {}),
          },
        });
      }

      if (learnerMemberships.length) {
        await tx.learner_Institution_Membership.updateMany({
          where: { institution_id: id, status: { in: openStatuses } },
          data: {
            status: OrgMembershipStatus.left,
            responded_at: new Date(),
            ...(actorUserId ? { responded_by_user_id: actorUserId } : {}),
          },
        });
      }

      if (studentIds.length) {
        await tx.student_Subject_Enrollment.updateMany({
          where: {
            student_id: { in: studentIds },
            status: { in: ['approved', 'active', 'pending'] },
          },
          data: { status: 'inactive' },
        });

        await tx.test_Assignment.updateMany({
          where: {
            student_id: { in: studentIds },
            status: { notIn: ['completed', 'cancelled'] },
            NOT: { assignment_source: 'SELF_SMART' },
          },
          data: { status: 'cancelled' },
        });

        await tx.student.updateMany({
          where: { id: { in: studentIds } },
          data: { status: 'inactive' },
        });

        const aspirantStudents = await tx.participant.findMany({
          where: {
            participant_type: 'ASPIRANT',
            status: 'active',
            student_id: { in: studentIds },
          },
          select: { student_id: true },
        });
        const keepActive = aspirantStudents
          .map((p) => p.student_id)
          .filter((x): x is number => x != null);
        if (keepActive.length) {
          await tx.student.updateMany({
            where: { id: { in: keepActive } },
            data: { status: 'active' },
          });
        }
      }

      await tx.participant.updateMany({
        where: {
          institution_id: id,
          participant_type: 'INSTITUTE_STUDENT',
          status: 'active',
        },
        data: { status: 'inactive', institution_id: null },
      });

      // Detach papers from org before delete (also SetNull on Institution delete)
      await tx.test_Paper.updateMany({
        where: { institution_id: id },
        data: { institution_id: null },
      });

      await tx.institution.delete({ where: { id } });
    });

    const notifyIds = [
      ...teacherMemberships.map((m) => m.user_id),
      ...learnerMemberships.map((m) => m.user_id),
    ].filter((uid) => uid !== actorUserId);

    await this.notifications.notifyUsers(notifyIds, {
      title: 'Organization deleted',
      message: `${institution.name} has been permanently deleted. You can join another School / Coaching Center. Your papers and completed results are kept.`,
      type: 'org_hard_delete',
      action_url: '/login',
    });

    return {
      message: 'Organization permanently deleted. Members notified and released.',
      institution_id: id,
      institution_name: institution.name,
      teachers_released: teacherMemberships.length,
      learners_released: learnerMemberships.length,
    };
  }

  async hardDeleteForOrgAdmin(actorUserId: number, institutionId: number) {
    await this.assertOrgAdmin(actorUserId, institutionId);
    return this.hardDelete(institutionId, actorUserId);
  }

  async leaveMyMembership(userId: number) {
    const membership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
      include: { institution: { select: { id: true, name: true } } },
    });
    if (!membership) throw new NotFoundException('No organization membership found');

    if (membership.status === OrgMembershipStatus.pending) {
      return this.cancelMyPendingRequest(userId);
    }

    if (membership.member_role === OrgMemberRole.ADMIN) {
      const adminCount = await this.prisma.institution_Membership.count({
        where: {
          institution_id: membership.institution_id,
          member_role: OrgMemberRole.ADMIN,
          status: OrgMembershipStatus.active,
        },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'You are the sole organization admin. Promote another teacher to ADMIN or soft-close the organization before leaving.',
        );
      }
    }

    await this.prisma.institution_Membership.update({
      where: { id: membership.id },
      data: { status: OrgMembershipStatus.left, responded_at: new Date() },
    });

    // Deactivate L2 enrollments under this teacher's subjects
    const teacherSubjects = await this.prisma.teacher_Subject.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    if (teacherSubjects.length) {
      await this.prisma.student_Subject_Enrollment.updateMany({
        where: {
          teacher_subject_id: { in: teacherSubjects.map((t) => t.id) },
          status: { in: ['approved', 'active', 'pending'] },
        },
        data: { status: 'inactive' },
      });
    }

    // Cancel incomplete teacher-assigned tests they assigned (papers stay theirs)
    await this.prisma.test_Assignment.updateMany({
      where: {
        assigned_by_user_id: userId,
        status: { notIn: ['completed', 'cancelled'] },
        NOT: { assignment_source: 'SELF_SMART' },
        student: {
          learner_memberships: {
            some: {
              institution_id: membership.institution_id,
              status: { in: [OrgMembershipStatus.active, OrgMembershipStatus.left] },
            },
          },
        },
      },
      data: { status: 'cancelled' },
    });

    const admins = await this.prisma.institution_Membership.findMany({
      where: {
        institution_id: membership.institution_id,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
      select: { user_id: true },
    });
    await this.notifications.notifyUsers(
      admins.map((a) => a.user_id).filter((id) => id !== userId),
      {
        title: 'Teacher left organization',
        message: `A teacher left ${membership.institution.name}.`,
        type: 'org_teacher_left',
      },
    );

    return {
      message: `You left ${membership.institution.name}. You can join or create another organization.`,
    };
  }

  async leaveMyLearnerMembership(userId: number) {
    const membership = await this.prisma.learner_Institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
      include: { institution: { select: { id: true, name: true } } },
    });
    if (!membership) throw new NotFoundException('No school/coaching membership found');

    if (membership.status === OrgMembershipStatus.pending) {
      return this.cancelMyPendingLearnerRequest(userId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.learner_Institution_Membership.update({
        where: { id: membership.id },
        data: { status: OrgMembershipStatus.left, responded_at: new Date() },
      });

      if (membership.student_id) {
        await tx.student_Subject_Enrollment.updateMany({
          where: {
            student_id: membership.student_id,
            status: { in: ['approved', 'active', 'pending'] },
          },
          data: { status: 'inactive' },
        });

        await tx.test_Assignment.updateMany({
          where: {
            student_id: membership.student_id,
            status: { notIn: ['completed', 'cancelled'] },
            NOT: { assignment_source: 'SELF_SMART' },
          },
          data: { status: 'cancelled' },
        });

        const aspirant = await tx.participant.findFirst({
          where: { user_id: userId, participant_type: 'ASPIRANT', status: 'active' },
        });
        await tx.student.update({
          where: { id: membership.student_id },
          data: { status: aspirant ? 'active' : 'inactive' },
        });
      }

      await tx.participant.updateMany({
        where: {
          user_id: userId,
          participant_type: 'INSTITUTE_STUDENT',
          institution_id: membership.institution_id,
        },
        data: { status: 'inactive', institution_id: null, exam_cohort_id: null },
      });
    });

    const admins = await this.prisma.institution_Membership.findMany({
      where: {
        institution_id: membership.institution_id,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
      select: { user_id: true },
    });
    await this.notifications.notifyUsers(
      admins.map((a) => a.user_id),
      {
        title: 'Learner left organization',
        message: `A learner left ${membership.institution.name}.`,
        type: 'org_learner_left',
      },
    );

    return {
      message: `You left ${membership.institution.name}. Self-practice remains available; you may join another coaching later.`,
    };
  }

  async promoteMemberToAdmin(actorUserId: number, membershipId: number) {
    const membership = await this.prisma.institution_Membership.findUnique({
      where: { id: membershipId },
      include: {
        user: { select: { id: true, name: true, email_id: true } },
        institution: { select: { id: true, name: true } },
      },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.status !== OrgMembershipStatus.active) {
      throw new BadRequestException('Only active teachers can be promoted');
    }

    await this.assertOrgAdmin(actorUserId, membership.institution_id);

    const updated = await this.prisma.institution_Membership.update({
      where: { id: membershipId },
      data: { member_role: OrgMemberRole.ADMIN },
      include: {
        user: { select: { id: true, name: true, email_id: true } },
        institution: { select: { id: true, name: true } },
      },
    });

    await this.notifications.notifyUsers([membership.user_id], {
      title: 'Promoted to organization admin',
      message: `You are now an ADMIN of ${membership.institution.name}.`,
      type: 'org_promote',
    });

    return { message: 'Teacher promoted to ADMIN', membership: updated };
  }

  async listOrgMembersForAdmin(adminUserId: number) {
    const adminOrgs = await this.prisma.institution_Membership.findMany({
      where: {
        user_id: adminUserId,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
      select: { institution_id: true },
    });
    const institutionIds = adminOrgs.map((o) => o.institution_id);
    if (!institutionIds.length) return [];

    return this.prisma.institution_Membership.findMany({
      where: {
        institution_id: { in: institutionIds },
        status: OrgMembershipStatus.active,
      },
      orderBy: [{ member_role: 'asc' }, { created_at: 'asc' }],
      include: {
        user: { select: { id: true, name: true, email_id: true, contact_number: true } },
        institution: { select: { id: true, name: true, org_code: true } },
      },
    });
  }

  async addProgram(institutionId: number, examProgramId: number) {
    await this.findOne(institutionId);
    return this.prisma.institution_Program.upsert({
      where: {
        institution_id_exam_program_id: {
          institution_id: institutionId,
          exam_program_id: examProgramId,
        },
      },
      update: {},
      create: { institution_id: institutionId, exam_program_id: examProgramId },
    });
  }

  // ---------- Cohorts ----------
  async findCohorts(examProgramId?: number, institutionId?: number) {
    return this.prisma.exam_Cohort.findMany({
      where: {
        ...(examProgramId ? { exam_program_id: examProgramId } : {}),
        ...(institutionId ? { institution_id: institutionId } : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        exam_program: { include: { exam_body: true } },
        institution: { select: { id: true, name: true, institution_type: true } },
        _count: { select: { participants: true, teacher_mappings: true } },
        teacher_mappings: {
          select: {
            id: true,
            user_id: true,
            user: { select: { id: true, name: true, email_id: true } },
          },
        },
      },
    });
  }

  async createCohortForTeacher(userId: number, dto: CreateCohortDto) {
    const membership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: OrgMembershipStatus.active,
      },
    });
    if (!membership) {
      throw new BadRequestException('Join an organization before creating cohorts');
    }

    // Org teachers may create cohorts for their own institution only
    const institutionId = dto.institution_id ?? membership.institution_id;
    if (institutionId !== membership.institution_id) {
      const isAdmin = membership.member_role === OrgMemberRole.ADMIN;
      if (!isAdmin) {
        throw new BadRequestException('You can only create cohorts for your own organization');
      }
      await this.assertOrgAdmin(userId, institutionId);
    }

    const program = await this.prisma.exam_Program.findUnique({ where: { id: dto.exam_program_id } });
    if (!program) throw new NotFoundException(`Exam program ${dto.exam_program_id} not found`);

    // Ensure institution is linked to the program
    await this.prisma.institution_Program.upsert({
      where: {
        institution_id_exam_program_id: {
          institution_id: institutionId,
          exam_program_id: dto.exam_program_id,
        },
      },
      update: {},
      create: { institution_id: institutionId, exam_program_id: dto.exam_program_id },
    });

    const cohort = await this.prisma.exam_Cohort.create({
      data: {
        exam_program_id: dto.exam_program_id,
        institution_id: institutionId,
        name: dto.name.trim(),
        academic_year: dto.academic_year?.trim() || null,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
      include: { exam_program: true, institution: true },
    });

    // Creator auto-mapped as teaching this cohort
    await this.prisma.teacher_Exam_Cohort.create({
      data: { user_id: userId, exam_cohort_id: cohort.id },
    });

    return {
      message: 'Cohort created and you were mapped as a teacher for it',
      cohort,
    };
  }

  async createCohort(dto: CreateCohortDto) {
    return this.prisma.exam_Cohort.create({
      data: {
        ...dto,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
      include: { exam_program: true, institution: true },
    });
  }

  async removeCohort(id: number) {
    const cohort = await this.prisma.exam_Cohort.findUnique({ where: { id } });
    if (!cohort) throw new NotFoundException(`Cohort ${id} not found`);
    return this.prisma.exam_Cohort.delete({ where: { id } });
  }

  async removeCohortForActor(actorUserId: number, cohortId: number, isPlatformAdmin = false) {
    const cohort = await this.prisma.exam_Cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new NotFoundException(`Cohort ${cohortId} not found`);

    if (!isPlatformAdmin) {
      if (!cohort.institution_id) {
        throw new BadRequestException('Only platform admins can delete unscoped cohorts');
      }
      await this.assertOrgAdmin(actorUserId, cohort.institution_id);
    }

    await this.prisma.exam_Cohort.delete({ where: { id: cohortId } });
    return { message: 'Cohort deleted' };
  }

  async listMyTeacherCohorts(userId: number) {
    return this.prisma.teacher_Exam_Cohort.findMany({
      where: { user_id: userId },
      include: {
        exam_cohort: {
          include: {
            exam_program: { include: { exam_body: true } },
            institution: { select: { id: true, name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async mapTeacherToCohort(
    actorUserId: number,
    dto: { exam_cohort_id: number; user_id?: number },
  ) {
    const targetUserId = dto.user_id ?? actorUserId;
    const cohort = await this.prisma.exam_Cohort.findUnique({
      where: { id: dto.exam_cohort_id },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    if (!cohort.institution_id) {
      throw new BadRequestException('Cohort is not linked to an organization');
    }

    const actorMembership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: actorUserId,
        institution_id: cohort.institution_id,
        status: OrgMembershipStatus.active,
      },
    });
    if (!actorMembership) {
      throw new BadRequestException('You must belong to this cohort\'s organization');
    }

    if (targetUserId !== actorUserId) {
      if (actorMembership.member_role !== OrgMemberRole.ADMIN) {
        throw new BadRequestException('Only org admins can map other teachers to cohorts');
      }
    }

    const targetMembership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: targetUserId,
        institution_id: cohort.institution_id,
        status: OrgMembershipStatus.active,
      },
    });
    if (!targetMembership) {
      throw new BadRequestException('Target teacher is not an active member of this organization');
    }

    const mapping = await this.prisma.teacher_Exam_Cohort.upsert({
      where: {
        user_id_exam_cohort_id: {
          user_id: targetUserId,
          exam_cohort_id: cohort.id,
        },
      },
      create: { user_id: targetUserId, exam_cohort_id: cohort.id },
      update: {},
      include: {
        user: { select: { id: true, name: true, email_id: true } },
        exam_cohort: {
          include: { exam_program: true, institution: { select: { id: true, name: true } } },
        },
      },
    });

    return { message: 'Teacher mapped to cohort', mapping };
  }

  async unmapTeacherFromCohort(actorUserId: number, mappingId: number) {
    const mapping = await this.prisma.teacher_Exam_Cohort.findUnique({
      where: { id: mappingId },
      include: { exam_cohort: true },
    });
    if (!mapping) throw new NotFoundException('Teacher–cohort mapping not found');
    if (!mapping.exam_cohort.institution_id) {
      throw new BadRequestException('Cohort is not linked to an organization');
    }

    if (mapping.user_id !== actorUserId) {
      await this.assertOrgAdmin(actorUserId, mapping.exam_cohort.institution_id);
    }

    await this.prisma.teacher_Exam_Cohort.delete({ where: { id: mappingId } });
    return { message: 'Teacher unmapped from cohort' };
  }

  // ---------- Teacher join / accept (P4) ----------

  /** Public + logged-in: browse PUBLIC active orgs (PRIVATE hidden). */
  async discoverPublic(search?: string, institutionType?: string, cityId?: number) {
    const typeFilter =
      institutionType === InstitutionType.COACHING_CENTER ||
      institutionType === InstitutionType.SCHOOL
        ? [institutionType]
        : [InstitutionType.SCHOOL, InstitutionType.COACHING_CENTER];

    return this.prisma.institution.findMany({
      where: {
        is_active: true,
        visibility: InstitutionVisibility.PUBLIC,
        institution_type: { in: typeFilter },
        ...(search?.trim()
          ? { name: { contains: search.trim(), mode: 'insensitive' as const } }
          : {}),
        ...(cityId
          ? { school: { address: { city_id: cityId } } }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        org_code: true,
        institution_type: true,
        visibility: true,
        school: { select: { id: true, name: true, board: { select: { id: true, name: true } } } },
        _count: { select: { memberships: { where: { status: OrgMembershipStatus.active } } } },
      },
    });
  }

  async getMyMembership(userId: number) {
    return this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            org_code: true,
            institution_type: true,
            visibility: true,
            school_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  private async assertNoActiveOrPendingMembership(userId: number) {
    const existing = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
    });
    if (existing) {
      throw new ConflictException(
        existing.status === OrgMembershipStatus.pending
          ? 'You already have a pending join request. Wait for a decision or cancel it first.'
          : 'You already belong to an organization. Leave it before joining another.',
      );
    }
  }

  private async assertOrgAdmin(userId: number, institutionId: number) {
    const admin = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        institution_id: institutionId,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
    });
    if (!admin) {
      throw new BadRequestException('Only organization admins can perform this action');
    }
    return admin;
  }

  async requestJoin(userId: number, institutionId: number, requestMessage?: string) {
    await this.assertNoActiveOrPendingMembership(userId);

    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution?.is_active) {
      throw new NotFoundException('Organization not found');
    }
    if (institution.visibility === InstitutionVisibility.PRIVATE) {
      throw new BadRequestException(
        'This organization is private. Join using the org code instead.',
      );
    }

    const membership = await this.prisma.institution_Membership.create({
      data: {
        user_id: userId,
        institution_id: institution.id,
        member_role: OrgMemberRole.TEACHER,
        status: OrgMembershipStatus.pending,
        request_message: requestMessage?.trim() || null,
      },
      include: {
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true, visibility: true },
        },
      },
    });

    return {
      message: 'Join request sent. Waiting for organization admin approval.',
      membership,
    };
  }

  async requestJoinByCode(userId: number, orgCode: string, requestMessage?: string) {
    await this.assertNoActiveOrPendingMembership(userId);

    const institution = await this.prisma.institution.findUnique({
      where: { org_code: orgCode.trim().toUpperCase() },
    });
    // Also try exact case match if uppercase miss
    const org =
      institution ||
      (await this.prisma.institution.findFirst({
        where: { org_code: { equals: orgCode.trim(), mode: 'insensitive' } },
      }));

    if (!org?.is_active) {
      throw new NotFoundException('No active organization found for that code');
    }

    const membership = await this.prisma.institution_Membership.create({
      data: {
        user_id: userId,
        institution_id: org.id,
        member_role: OrgMemberRole.TEACHER,
        status: OrgMembershipStatus.pending,
        request_message: requestMessage?.trim() || null,
      },
      include: {
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true, visibility: true },
        },
      },
    });

    return {
      message: 'Join request sent. Waiting for organization admin approval.',
      membership,
    };
  }

  async cancelMyPendingRequest(userId: number) {
    const pending = await this.prisma.institution_Membership.findFirst({
      where: { user_id: userId, status: OrgMembershipStatus.pending },
    });
    if (!pending) throw new NotFoundException('No pending join request found');

    await this.prisma.institution_Membership.update({
      where: { id: pending.id },
      data: { status: OrgMembershipStatus.left, responded_at: new Date() },
    });

    return { message: 'Join request cancelled' };
  }

  /** Pending teacher join requests for orgs where this user is ADMIN. */
  async listPendingJoinRequestsForAdmin(adminUserId: number) {
    const adminOrgs = await this.prisma.institution_Membership.findMany({
      where: {
        user_id: adminUserId,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
      select: { institution_id: true },
    });
    const institutionIds = adminOrgs.map((o) => o.institution_id);
    if (!institutionIds.length) return [];

    return this.prisma.institution_Membership.findMany({
      where: {
        institution_id: { in: institutionIds },
        status: OrgMembershipStatus.pending,
        member_role: OrgMemberRole.TEACHER,
      },
      orderBy: { requested_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email_id: true,
            contact_number: true,
            highest_qualification: true,
          },
        },
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true },
        },
      },
    });
  }

  async respondToJoinRequest(
    adminUserId: number,
    membershipId: number,
    status: 'active' | 'rejected',
  ) {
    const membership = await this.prisma.institution_Membership.findUnique({
      where: { id: membershipId },
      include: { institution: true, user: { select: { id: true, name: true, email_id: true } } },
    });
    if (!membership) throw new NotFoundException('Membership request not found');
    if (membership.status !== OrgMembershipStatus.pending) {
      throw new BadRequestException('This request is no longer pending');
    }

    await this.assertOrgAdmin(adminUserId, membership.institution_id);

    // If accepting, ensure teacher still has no other active membership
    if (status === 'active') {
      const other = await this.prisma.institution_Membership.findFirst({
        where: {
          user_id: membership.user_id,
          status: OrgMembershipStatus.active,
          id: { not: membership.id },
        },
      });
      if (other) {
        throw new ConflictException('This teacher already belongs to another organization');
      }
    }

    const updated = await this.prisma.institution_Membership.update({
      where: { id: membershipId },
      data: {
        status: status === 'active' ? OrgMembershipStatus.active : OrgMembershipStatus.rejected,
        responded_at: new Date(),
        responded_by_user_id: adminUserId,
      },
      include: {
        user: { select: { id: true, name: true, email_id: true } },
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true, school_id: true },
        },
      },
    });

    if (status === 'active' && updated.institution.school_id) {
      await this.mapCurriculumScopeToTeacherSubjects(
        updated.user.id,
        updated.institution.school_id,
      );
    }

    return {
      message: status === 'active' ? 'Teacher join request accepted' : 'Teacher join request rejected',
      membership: updated,
    };
  }

  /** Pending learner (student) join requests for orgs where this user is ADMIN. */
  async listPendingLearnerRequestsForAdmin(adminUserId: number) {
    const adminOrgs = await this.prisma.institution_Membership.findMany({
      where: {
        user_id: adminUserId,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
      select: { institution_id: true },
    });
    const institutionIds = adminOrgs.map((o) => o.institution_id);
    if (!institutionIds.length) return [];

    return this.prisma.learner_Institution_Membership.findMany({
      where: {
        institution_id: { in: institutionIds },
        status: OrgMembershipStatus.pending,
      },
      orderBy: { requested_at: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, email_id: true, contact_number: true },
        },
        student: {
          select: {
            id: true,
            student_id: true,
            status: true,
            school_standard: {
              select: {
                standard: { select: { id: true, name: true } },
                school: { select: { id: true, name: true } },
              },
            },
          },
        },
        participant: {
          select: {
            id: true,
            participant_type: true,
            registration_code: true,
          },
        },
        school_standard: {
          select: {
            id: true,
            standard: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
          },
        },
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true },
        },
      },
    });
  }

  /**
   * Auto-create approved L2 enrollments for every Teacher_Subject of this
   * school_standard taught by active teachers in the institution.
   */
  private async autoMapLearnerToTeachers(
    tx: any,
    opts: {
      studentId: number;
      schoolStandardId: number;
      institutionId: number;
    },
  ): Promise<number> {
    const teacherMemberships = await tx.institution_Membership.findMany({
      where: {
        institution_id: opts.institutionId,
        status: OrgMembershipStatus.active,
      },
      select: { user_id: true },
    });
    const teacherIds = teacherMemberships.map((m) => m.user_id);
    if (!teacherIds.length) return 0;

    const teacherSubjects = await tx.teacher_Subject.findMany({
      where: {
        school_standard_id: opts.schoolStandardId,
        user_id: { in: teacherIds },
      },
      select: { id: true },
    });
    if (!teacherSubjects.length) return 0;

    const academicYear = currentAcademicYear();
    const now = new Date();
    let createdOrUpdated = 0;

    for (const ts of teacherSubjects) {
      await tx.student_Subject_Enrollment.upsert({
        where: {
          student_id_teacher_subject_id: {
            student_id: opts.studentId,
            teacher_subject_id: ts.id,
          },
        },
        create: {
          student_id: opts.studentId,
          teacher_subject_id: ts.id,
          status: 'approved',
          academic_year: academicYear,
          enrollment_date: now,
          responded_at: now,
          teacher_response: 'Auto-mapped on organization membership approval',
        },
        update: {
          status: 'approved',
          enrollment_date: now,
          responded_at: now,
          teacher_response: 'Auto-mapped on organization membership approval',
        },
      });
      createdOrUpdated += 1;
    }

    return createdOrUpdated;
  }

  private async resolveStudentSchoolStandardId(tx: any, studentId: number): Promise<number | null> {
    const st = await tx.student.findUnique({
      where: { id: studentId },
      select: { school_standard_id: true },
    });
    return st?.school_standard_id ?? null;
  }

  private async resolveFirstSchoolStandardForInstitution(
    tx: any,
    schoolId: number | null | undefined,
  ): Promise<number | null> {
    const firstSs = await tx.school_Standard.findFirst({
      where: { school_id: schoolId ?? undefined },
      orderBy: { id: 'asc' },
    });
    return firstSs?.id ?? null;
  }

  private async upsertInstituteStudentParticipant(tx: any, membership: any) {
    let institute = await tx.participant.findFirst({
      where: {
        user_id: membership.user_id,
        participant_type: 'INSTITUTE_STUDENT',
      },
    });
    if (institute) {
      return tx.participant.update({
        where: { id: institute.id },
        data: {
          institution_id: membership.institution_id,
          status: 'active',
        },
      });
    }
    return tx.participant.create({
      data: {
        user_id: membership.user_id,
        participant_type: 'INSTITUTE_STUDENT',
        institution_id: membership.institution_id,
        status: 'active',
        registration_code:
          'INS-' + Date.now().toString(36).toUpperCase() + '-' + membership.user_id,
      },
    });
  }

  private async copyAspirantProgramsToInstituteParticipant(
    tx: any,
    aspirantId: number,
    instituteParticipantId: number,
  ) {
    const aspirantPrograms = await tx.participant_Program.findMany({
      where: { participant_id: aspirantId },
      select: { exam_program_id: true },
    });
    for (const pp of aspirantPrograms) {
      await tx.participant_Program.upsert({
        where: {
          participant_id_exam_program_id: {
            participant_id: instituteParticipantId,
            exam_program_id: pp.exam_program_id,
          },
        },
        create: {
          participant_id: instituteParticipantId,
          exam_program_id: pp.exam_program_id,
        },
        update: {},
      });
    }
  }

  private async approveAspirantCoachingLearnerJoin(
    tx: any,
    membership: any,
    aspirant: { id: number },
  ): Promise<{
    studentId: number;
    schoolStandardId: number;
    instituteParticipantId: number;
  }> {
    const student = await tx.student.findUnique({
      where: { user_id: membership.user_id },
    });
    if (!student) {
      throw new BadRequestException('Aspirant has no Student bridge record');
    }

    let schoolStandardId = membership.school_standard_id;
    if (!schoolStandardId) {
      schoolStandardId = student.school_standard_id ?? null;
    }
    if (!schoolStandardId) {
      schoolStandardId = await this.resolveFirstSchoolStandardForInstitution(
        tx,
        membership.institution.school_id,
      );
    }
    if (!schoolStandardId) {
      throw new BadRequestException(
        'Join request is missing school_standard_id; cannot approve',
      );
    }

    await tx.student.update({
      where: { id: student.id },
      data: {
        school_standard_id: schoolStandardId,
        status: 'active',
      },
    });

    const institute = await this.upsertInstituteStudentParticipant(tx, membership);
    await this.copyAspirantProgramsToInstituteParticipant(tx, aspirant.id, institute.id);

    return {
      studentId: student.id,
      schoolStandardId,
      instituteParticipantId: institute.id,
    };
  }

  private async applyLearnerJoinRequestSideEffects(
    tx: any,
    ctx: {
      status: 'active' | 'rejected';
      membership: any;
      aspirant: { id: number } | null;
      studentId: number | null;
      schoolStandardId: number | null;
      instituteParticipantId: number | null;
    },
  ): Promise<{
    studentId: number | null;
    schoolStandardId: number | null;
    instituteParticipantId: number | null;
  }> {
    const { status, membership, aspirant } = ctx;
    let { studentId, schoolStandardId, instituteParticipantId } = ctx;

    if (status === 'active' && aspirant && membership.institution.institution_type === InstitutionType.COACHING_CENTER) {
      return this.approveAspirantCoachingLearnerJoin(tx, membership, aspirant);
    }

    if (status === 'active' && studentId) {
      await tx.student.update({
        where: { id: studentId },
        data: { status: 'active' },
      });
      if (!schoolStandardId) {
        schoolStandardId = await this.resolveStudentSchoolStandardId(tx, studentId);
      }
    } else if (status === 'rejected' && studentId) {
      await tx.student.update({
        where: { id: studentId },
        data: { status: 'rejected' },
      });
    }

    return { studentId, schoolStandardId, instituteParticipantId };
  }

  private async resolveOpenLearningIdsForCsvInvite(): Promise<{
    openSchoolStandardId: number | null;
    openInstitutionId: number | null;
  }> {
    const openBoard = await this.prisma.board.findUnique({
      where: { abbreviation: OPEN_LEARNING_BOARD_ABBR },
    });
    if (!openBoard) {
      return { openSchoolStandardId: null, openInstitutionId: null };
    }

    const openSchool = await this.prisma.school.findFirst({
      where: { board_id: openBoard.id, name: OPEN_LEARNING_SCHOOL_NAME },
    });
    if (!openSchool) {
      return { openSchoolStandardId: null, openInstitutionId: null };
    }

    const ss = await this.prisma.school_Standard.findFirst({
      where: { school_id: openSchool.id },
      orderBy: { id: 'asc' },
    });
    const openInst = await this.prisma.institution.findFirst({
      where: { school_id: openSchool.id },
    });

    return {
      openSchoolStandardId: ss?.id ?? null,
      openInstitutionId: openInst?.id ?? null,
    };
  }

  private async resolveCoachingSchoolStandardForInvite(institution: any) {
    if (institution.institution_type !== InstitutionType.COACHING_CENTER || !institution.school_id) {
      return null;
    }
    return this.prisma.school_Standard.findFirst({
      where: { school_id: institution.school_id },
      orderBy: { id: 'asc' },
    });
  }

  private async ensureTeacherUserForCsvInvite(
    email: string,
    name: string,
    hashedPassword: string,
  ): Promise<{ user: any; createdUser: boolean }> {
    const existingUser = await this.prisma.user.findUnique({ where: { email_id: email } });
    if (existingUser) {
      const hasTeacher = await this.prisma.user_Role.findFirst({
        where: { user_id: existingUser.id, role: { role_name: 'TEACHER' } },
      });
      if (hasTeacher) {
        return { user: existingUser, createdUser: false };
      }
      const teacherRole = await this.prisma.role.findFirst({ where: { role_name: 'TEACHER' } });
      if (teacherRole) {
        await this.prisma.user_Role.create({
          data: { user_id: existingUser.id, role_id: teacherRole.id },
        });
      }
      return { user: existingUser, createdUser: false };
    }

    const user = await this.prisma.user.create({
      data: {
        email_id: email,
        password: hashedPassword,
        name,
        contact_number: '0000000000',
        status: true,
      },
    });
    const teacherRole = await this.prisma.role.findFirst({ where: { role_name: 'TEACHER' } });
    if (teacherRole) {
      await this.prisma.user_Role.create({
        data: { user_id: user.id, role_id: teacherRole.id },
      });
    }
    return { user, createdUser: true };
  }

  private async processTeacherCsvInviteRow(
    email: string,
    name: string,
    institution: any,
    hashedPassword: string,
  ) {
    const { user, createdUser } = await this.ensureTeacherUserForCsvInvite(
      email,
      name,
      hashedPassword,
    );

    const existing = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: user.id,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
    });
    if (existing) {
      return {
        email,
        role: 'TEACHER',
        status: 'skipped' as const,
        user_id: user.id,
        message:
          existing.institution_id === institution.id
            ? `Already ${existing.status} in this organization`
            : `Already ${existing.status} in another organization`,
      };
    }

    await this.prisma.institution_Membership.create({
      data: {
        user_id: user.id,
        institution_id: institution.id,
        member_role: OrgMemberRole.TEACHER,
        status: OrgMembershipStatus.pending,
        request_message: 'Invited by admin (CSV)',
      },
    });
    return {
      email,
      role: 'TEACHER',
      status: 'invited' as const,
      user_id: user.id,
      ...(createdUser ? { temp_password: this.inviteTempPassword() } : {}),
      message: 'Pending teacher join request created',
    };
  }

  private async resolveExamProgramIdForLearnerInvite(row: CsvInviteRowDto): Promise<number | undefined> {
    let examProgramId = row.exam_program_id;
    if (examProgramId) return examProgramId;

    const cse = await this.prisma.exam_Program.findFirst({
      where: { OR: [{ code: 'CSE' }, { name: { contains: 'Civil Services' } }] },
      orderBy: { id: 'asc' },
    });
    return cse?.id;
  }

  private async existingLearnerCsvInviteSkip(
    user: { id: number } | null,
    email: string,
    institutionId: number,
  ) {
    if (!user) {
      return null;
    }
    const openMem = await this.prisma.learner_Institution_Membership.findFirst({
      where: {
        user_id: user.id,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
    });
    if (!openMem) {
      return null;
    }
    return {
      email,
      role: 'LEARNER' as const,
      status: 'skipped' as const,
      user_id: user.id,
      message:
        openMem.institution_id === institutionId
          ? `Already ${openMem.status} in this organization`
          : `Already ${openMem.status} in another organization`,
    };
  }

  private async resolveLearnerCsvInviteProfiles(
    user: any,
    email: string,
    name: string,
    hashedPassword: string,
    openSchoolStandardId: number,
    openInstitutionId: number,
    examProgramId: number,
  ) {
    if (!user) {
      const created = await this.prisma.user.create({
        data: {
          email_id: email,
          password: hashedPassword,
          name,
          contact_number: '0000000000',
          status: true,
        },
      });
      const studentRole = await this.prisma.role.findFirst({ where: { role_name: 'STUDENT' } });
      if (studentRole) {
        await this.prisma.user_Role.create({
          data: { user_id: created.id, role_id: studentRole.id },
        });
      }
      const profiles = await this.createNewLearnerProfilesForCsvInvite(
        created,
        openSchoolStandardId,
        openInstitutionId,
        examProgramId,
      );
      return {
        user: created,
        aspirantId: profiles.aspirantId,
        studentId: profiles.studentId,
        createdUser: true,
      };
    }

    const profiles = await this.ensureExistingLearnerProfilesForCsvInvite(user, examProgramId);
    if ('error' in profiles) {
      return { error: profiles.error, userId: user.id };
    }
    return {
      user,
      aspirantId: profiles.aspirantId,
      studentId: profiles.studentId,
      createdUser: false,
    };
  }

  private async createNewLearnerProfilesForCsvInvite(
    user: any,
    openSchoolStandardId: number,
    openInstitutionId: number,
    examProgramId: number,
  ): Promise<{ aspirantId: number; studentId: number }> {
    const registrationCode = 'ASP-' + Date.now().toString(36).toUpperCase() + '-' + user.id;
    const student = await this.prisma.student.create({
      data: {
        user_id: user.id,
        school_standard_id: openSchoolStandardId,
        student_id: registrationCode,
        status: 'pending',
      },
    });
    const participant = await this.prisma.participant.create({
      data: {
        user_id: user.id,
        participant_type: 'ASPIRANT',
        institution_id: openInstitutionId,
        registration_code: registrationCode,
        student_id: student.id,
        status: 'active',
        participant_programs: { create: { exam_program_id: examProgramId } },
      },
    });
    return { aspirantId: participant.id, studentId: student.id };
  }

  private async ensureExistingLearnerProfilesForCsvInvite(
    user: any,
    examProgramId: number,
  ): Promise<
    | { aspirantId: number; studentId: number }
    | { error: string }
  > {
    const student = await this.prisma.student.findUnique({ where: { user_id: user.id } });
    const aspirant = await this.prisma.participant.findFirst({
      where: { user_id: user.id, participant_type: 'ASPIRANT' },
    });
    if (!student || !aspirant) {
      return { error: 'Existing user is not an aspirant/learner profile' };
    }

    await this.prisma.participant_Program.upsert({
      where: {
        participant_id_exam_program_id: {
          participant_id: aspirant.id,
          exam_program_id: examProgramId,
        },
      },
      create: { participant_id: aspirant.id, exam_program_id: examProgramId },
      update: {},
    });
    return { aspirantId: aspirant.id, studentId: student.id };
  }

  private async processLearnerCsvInviteRow(params: LearnerCsvInviteRowParams) {
    const {
      email,
      name,
      row,
      institution,
      openSchoolStandardId,
      openInstitutionId,
      coachingSchoolStandard,
      hashedPassword,
    } = params;
    if (institution.institution_type !== InstitutionType.COACHING_CENTER) {
      return {
        email,
        role: 'LEARNER',
        status: 'error' as const,
        message: 'Learner CSV invite is only supported for Coaching Centers',
      };
    }
    if (!openSchoolStandardId || !openInstitutionId) {
      return {
        email,
        role: 'LEARNER',
        status: 'error' as const,
        message: 'Open Learning infrastructure missing — run migrate-to-option-c.js',
      };
    }

    const examProgramId = await this.resolveExamProgramIdForLearnerInvite(row);
    if (!examProgramId) {
      return {
        email,
        role: 'LEARNER',
        status: 'error' as const,
        message: 'exam_program_id required (no default Civil Services program found)',
      };
    }

    let user = await this.prisma.user.findUnique({ where: { email_id: email } });
    const existingSkip = await this.existingLearnerCsvInviteSkip(user, email, institution.id);
    if (existingSkip) {
      return existingSkip;
    }

    const profiles = await this.resolveLearnerCsvInviteProfiles(
      user,
      email,
      name,
      hashedPassword,
      openSchoolStandardId,
      openInstitutionId,
      examProgramId,
    );
    if ('error' in profiles) {
      return {
        email,
        role: 'LEARNER',
        status: 'error' as const,
        user_id: profiles.userId,
        message: profiles.error,
      };
    }

    user = profiles.user;
    const { aspirantId, studentId, createdUser } = profiles;

    await this.prisma.learner_Institution_Membership.create({
      data: {
        user_id: user.id,
        institution_id: institution.id,
        student_id: studentId,
        participant_id: aspirantId,
        school_standard_id: coachingSchoolStandard?.id ?? null,
        status: OrgMembershipStatus.pending,
        request_message: 'Invited by admin (CSV)',
      },
    });

    return {
      email,
      role: 'LEARNER',
      status: 'invited' as const,
      user_id: user.id,
      ...(createdUser ? { temp_password: this.inviteTempPassword() } : {}),
      message: 'Pending learner join request created',
    };
  }

  async respondToLearnerJoinRequest(
    adminUserId: number,
    membershipId: number,
    status: 'active' | 'rejected',
  ) {
    const membership = await this.prisma.learner_Institution_Membership.findUnique({
      where: { id: membershipId },
      include: {
        institution: true,
        student: true,
        participant: true,
        user: { select: { id: true, name: true, email_id: true } },
      },
    });
    if (!membership) throw new NotFoundException('Learner membership request not found');
    if (membership.status !== OrgMembershipStatus.pending) {
      throw new BadRequestException('This request is no longer pending');
    }

    await this.assertOrgAdmin(adminUserId, membership.institution_id);

    const nextStatus =
      status === 'active' ? OrgMembershipStatus.active : OrgMembershipStatus.rejected;

    const result = await this.prisma.$transaction(async (tx) => {
      const aspirant = await tx.participant.findFirst({
        where: {
          user_id: membership.user_id,
          participant_type: 'ASPIRANT',
        },
      });

      const updated = await this.applyLearnerJoinRequestSideEffects(tx, {
        status,
        membership,
        aspirant,
        studentId: membership.student_id,
        schoolStandardId: membership.school_standard_id,
        instituteParticipantId: membership.participant_id,
      });

      const row = await tx.learner_Institution_Membership.update({
        where: { id: membershipId },
        data: {
          status: nextStatus,
          responded_at: new Date(),
          responded_by_user_id: adminUserId,
          ...(updated.studentId ? { student_id: updated.studentId } : {}),
          ...(updated.instituteParticipantId ? { participant_id: updated.instituteParticipantId } : {}),
          ...(updated.schoolStandardId ? { school_standard_id: updated.schoolStandardId } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email_id: true } },
          student: {
            select: {
              id: true,
              student_id: true,
              status: true,
              school_standard: {
                select: {
                  standard: { select: { id: true, name: true } },
                },
              },
            },
          },
          participant: {
            select: { id: true, participant_type: true, registration_code: true },
          },
          institution: {
            select: { id: true, name: true, org_code: true, institution_type: true },
          },
        },
      });

      let autoMapped = 0;
      if (status === 'active' && updated.studentId && updated.schoolStandardId) {
        autoMapped = await this.autoMapLearnerToTeachers(tx, {
          studentId: updated.studentId,
          schoolStandardId: updated.schoolStandardId,
          institutionId: membership.institution_id,
        });
      }

      return { row, autoMapped };
    });

    const acceptanceDetail = result.autoMapped
      ? ` · auto-mapped to ${result.autoMapped} teacher subject(s)`
      : ' · no teacher subjects found for this standard yet';

    return {
      message:
        status === 'active'
          ? `Learner join request accepted${acceptanceDetail}`
          : 'Learner join request rejected',
      membership: result.row,
      auto_mapped_enrollments: result.autoMapped,
    };
  }

  private async assertNoActiveOrPendingLearnerMembership(userId: number) {
    const existing = await this.prisma.learner_Institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
    });
    if (existing) {
      throw new ConflictException(
        existing.status === OrgMembershipStatus.pending
          ? 'You already have a pending coaching join request. Wait for a decision or cancel it first.'
          : 'You already belong to a school/coaching organization. Leave it before joining another.',
      );
    }
  }

  private async resolveCoachingForJoin(institutionId: number) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        school: {
          select: {
            id: true,
            school_standards: {
              select: {
                id: true,
                standard: { select: { id: true, name: true, sequence_number: true } },
              },
            },
          },
        },
      },
    });
    if (!institution?.is_active) {
      throw new NotFoundException('Organization not found');
    }
    if (institution.institution_type !== InstitutionType.COACHING_CENTER) {
      throw new BadRequestException('Aspirants can only join Coaching Centers, not Schools');
    }
    if (!institution.school_id || !institution.school) {
      throw new BadRequestException('This coaching center has no linked curriculum school');
    }
    return institution;
  }

  private async assertAspirantUser(userId: number) {
    const aspirant = await this.prisma.participant.findFirst({
      where: { user_id: userId, participant_type: 'ASPIRANT', status: 'active' },
    });
    if (!aspirant) {
      throw new BadRequestException('Only aspirants can request to join a coaching center this way');
    }
    const student = await this.prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) {
      throw new BadRequestException('Aspirant Student profile not found');
    }
    return { aspirant, student };
  }

  async getMyLearnerMembership(userId: number) {
    return this.prisma.learner_Institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            org_code: true,
            institution_type: true,
            visibility: true,
          },
        },
        school_standard: {
          select: {
            id: true,
            standard: { select: { id: true, name: true } },
          },
        },
        participant: {
          select: { id: true, participant_type: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async cancelMyPendingLearnerRequest(userId: number) {
    const pending = await this.prisma.learner_Institution_Membership.findFirst({
      where: { user_id: userId, status: OrgMembershipStatus.pending },
    });
    if (!pending) throw new NotFoundException('No pending coaching join request found');

    await this.prisma.learner_Institution_Membership.update({
      where: { id: pending.id },
      data: { status: OrgMembershipStatus.left, responded_at: new Date() },
    });

    return { message: 'Coaching join request cancelled' };
  }

  async getCoachingStandards(institutionId: number) {
    return this.getJoinStandards(institutionId, { coachingOnly: true });
  }

  async getCoachingStandardsByCode(orgCode: string) {
    const org = await this.resolveOrgByCode(orgCode);
    return this.getCoachingStandards(org.id);
  }

  /** Public helper: standards for School or Coaching (registration / join). */
  async getJoinStandards(institutionId: number, opts?: { coachingOnly?: boolean }) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: {
        school: {
          select: {
            id: true,
            school_standards: {
              select: {
                id: true,
                standard: { select: { id: true, name: true, sequence_number: true } },
              },
            },
          },
        },
      },
    });
    if (!institution?.is_active) {
      throw new NotFoundException('Organization not found');
    }
    if (
      opts?.coachingOnly &&
      institution.institution_type !== InstitutionType.COACHING_CENTER
    ) {
      throw new BadRequestException('Aspirants can only join Coaching Centers, not Schools');
    }
    if (!institution.school_id || !institution.school) {
      throw new BadRequestException('This organization has no linked curriculum school');
    }
    return {
      institution: {
        id: institution.id,
        name: institution.name,
        org_code: institution.org_code,
        institution_type: institution.institution_type,
        visibility: institution.visibility,
      },
      standards: (institution.school?.school_standards || [])
        .map((ss) => ({
          school_standard_id: ss.id,
          standard_id: ss.standard.id,
          name: ss.standard.name,
          sequence_number: ss.standard.sequence_number,
        }))
        .sort((a, b) => a.sequence_number - b.sequence_number),
    };
  }

  async getJoinStandardsByCode(orgCode: string) {
    const org = await this.resolveOrgByCode(orgCode);
    return this.getJoinStandards(org.id);
  }

  private async resolveOrgByCode(orgCode: string) {
    const org =
      (await this.prisma.institution.findUnique({
        where: { org_code: orgCode.trim().toUpperCase() },
      })) ||
      (await this.prisma.institution.findFirst({
        where: { org_code: { equals: orgCode.trim(), mode: 'insensitive' } },
      }));
    if (!org?.is_active) {
      throw new NotFoundException('No active organization found for that code');
    }
    return org;
  }

  async requestCoachingJoin(
    userId: number,
    institutionId: number,
    schoolStandardId: number,
    requestMessage?: string,
  ) {
    await this.assertNoActiveOrPendingLearnerMembership(userId);
    const { aspirant, student } = await this.assertAspirantUser(userId);
    const institution = await this.resolveCoachingForJoin(institutionId);

    if (institution.visibility === InstitutionVisibility.PRIVATE) {
      throw new BadRequestException(
        'This coaching center is private. Join using the org code instead.',
      );
    }

    const schoolId = institution.school_id;
    if (schoolId == null) {
      throw new BadRequestException('This coaching center has no linked school');
    }
    const schoolStandard = await this.prisma.school_Standard.findFirst({
      where: { id: schoolStandardId, school_id: schoolId },
    });
    if (!schoolStandard) {
      throw new BadRequestException('Selected standard is not offered by this coaching center');
    }

    const membership = await this.prisma.learner_Institution_Membership.create({
      data: {
        user_id: userId,
        institution_id: institution.id,
        student_id: student.id,
        participant_id: aspirant.id,
        school_standard_id: schoolStandardId,
        status: OrgMembershipStatus.pending,
        request_message: requestMessage?.trim() || null,
      },
      include: {
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true, visibility: true },
        },
        school_standard: {
          select: { id: true, standard: { select: { id: true, name: true } } },
        },
      },
    });

    // Mirror pending on Student until admin approves
    await this.prisma.student.update({
      where: { id: student.id },
      data: { status: 'pending' },
    });

    return {
      message: 'Coaching join request sent. Waiting for organization admin approval.',
      membership,
    };
  }

  async requestCoachingJoinByCode(
    userId: number,
    orgCode: string,
    schoolStandardId: number,
    requestMessage?: string,
  ) {
    await this.assertNoActiveOrPendingLearnerMembership(userId);
    const { aspirant, student } = await this.assertAspirantUser(userId);

    const org =
      (await this.prisma.institution.findUnique({
        where: { org_code: orgCode.trim().toUpperCase() },
      })) ||
      (await this.prisma.institution.findFirst({
        where: { org_code: { equals: orgCode.trim(), mode: 'insensitive' } },
      }));
    if (!org?.is_active) {
      throw new NotFoundException('No active organization found for that code');
    }

    const institution = await this.resolveCoachingForJoin(org.id);
    const schoolId = institution.school_id;
    if (schoolId == null) {
      throw new BadRequestException('This coaching center has no linked school');
    }
    const schoolStandard = await this.prisma.school_Standard.findFirst({
      where: { id: schoolStandardId, school_id: schoolId },
    });
    if (!schoolStandard) {
      throw new BadRequestException('Selected standard is not offered by this coaching center');
    }

    const membership = await this.prisma.learner_Institution_Membership.create({
      data: {
        user_id: userId,
        institution_id: institution.id,
        student_id: student.id,
        participant_id: aspirant.id,
        school_standard_id: schoolStandardId,
        status: OrgMembershipStatus.pending,
        request_message: requestMessage?.trim() || null,
      },
      include: {
        institution: {
          select: { id: true, name: true, org_code: true, institution_type: true, visibility: true },
        },
        school_standard: {
          select: { id: true, standard: { select: { id: true, name: true } } },
        },
      },
    });

    await this.prisma.student.update({
      where: { id: student.id },
      data: { status: 'pending' },
    });

    return {
      message: 'Coaching join request sent. Waiting for organization admin approval.',
      membership,
    };
  }

  /**
   * Org-admin bulk invite: create users (if missing) + pending memberships.
   * Teachers → Institution_Membership; Learners → ASPIRANT + Learner_Institution_Membership.
   * Temp passwords are returned in the response for local QA (email stub).
   */
  async inviteMembersFromCsv(adminUserId: number, dto: CsvInviteDto) {
    const adminMembership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: adminUserId,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
      include: { institution: true },
    });
    if (!adminMembership) {
      throw new BadRequestException('Only organization admins can invite members');
    }
    const institution = adminMembership.institution;
    const hashedPassword = await bcrypt.hash(this.inviteTempPassword(), 10);

    const { openSchoolStandardId, openInstitutionId } =
      await this.resolveOpenLearningIdsForCsvInvite();
    const coachingSchoolStandard =
      await this.resolveCoachingSchoolStandardForInvite(institution);

    const results: Array<{
      email: string;
      role: string;
      status: 'invited' | 'skipped' | 'error';
      user_id?: number;
      temp_password?: string;
      message?: string;
    }> = [];

    for (const row of dto.rows) {
      const email = row.email.trim().toLowerCase();
      const name = row.name.trim();
      try {
        if (row.role === InviteRoleDto.TEACHER) {
          results.push(
            await this.processTeacherCsvInviteRow(email, name, institution, hashedPassword),
          );
          continue;
        }

        results.push(
          await this.processLearnerCsvInviteRow({
            email,
            name,
            row,
            institution,
            openSchoolStandardId,
            openInstitutionId,
            coachingSchoolStandard,
            hashedPassword,
          }),
        );
      } catch (e: any) {
        results.push({
          email,
          role: row.role,
          status: 'error',
          message: e?.message || 'Invite failed',
        });
      }
    }

    const invited = results.filter((r) => r.status === 'invited').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return {
      message: `Invite complete: ${invited} invited, ${skipped} skipped, ${errors} errors`,
      default_temp_password: this.inviteTempPassword(),
      invited,
      skipped,
      errors,
      results,
    };
  }
}
