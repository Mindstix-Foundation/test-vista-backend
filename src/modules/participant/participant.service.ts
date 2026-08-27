import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterAspirantDto, EnrollProgramDto, ParticipantFilterDto } from './dto/participant.dto';
import { InstitutionService } from '../institution/institution.service';

/**
 * Names of the "Open Learning" virtual infrastructure that lets aspirants
 * (no physical school) flow through the existing Student-based exam engine.
 */
export const OPEN_LEARNING = {
  BOARD_NAME: 'Test Vista Open Learning',
  BOARD_ABBR: 'TV-OPEN',
  STANDARD_NAME: 'Aspirant',
  SCHOOL_NAME: 'Test Vista Open Learning',
};

@Injectable()
export class ParticipantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly institutionService: InstitutionService,
  ) {}

  /**
   * Ensures the virtual board → standard → school → school_standard chain
   * exists (idempotent). Every aspirant gets a Student row under it so the
   * whole exam engine (assignments, attempts, results) works unchanged.
   */
  private async ensureOpenLearningInfra(tx: any) {
    let board = await tx.board.findUnique({ where: { abbreviation: OPEN_LEARNING.BOARD_ABBR } });
    if (!board) {
      let city = await tx.city.findFirst();
      if (!city) {
        const country = await tx.country.create({ data: { name: 'India' } });
        const state = await tx.state.create({ data: { country_id: country.id, name: 'Maharashtra' } });
        city = await tx.city.create({ data: { state_id: state.id, name: 'Pune' } });
      }
      const address = await tx.address.create({
        data: { city_id: city.id, postal_code: '000000', street: 'Virtual Campus' },
      });
      board = await tx.board.create({
        data: {
          name: OPEN_LEARNING.BOARD_NAME,
          abbreviation: OPEN_LEARNING.BOARD_ABBR,
          address_id: address.id,
        },
      });
      await tx.instruction_Medium.upsert({
        where: { board_id_instruction_medium: { board_id: board.id, instruction_medium: 'English' } },
        update: {},
        create: { board_id: board.id, instruction_medium: 'English' },
      });
    }

    let standard = await tx.standard.findFirst({
      where: { board_id: board.id, name: OPEN_LEARNING.STANDARD_NAME },
    });
    if (!standard) {
      standard = await tx.standard.create({
        data: { board_id: board.id, name: OPEN_LEARNING.STANDARD_NAME, sequence_number: 1 },
      });
    }

    let school = await tx.school.findFirst({
      where: { board_id: board.id, name: OPEN_LEARNING.SCHOOL_NAME },
    });
    if (!school) {
      const city = await tx.city.findFirst();
      const schoolAddress = await tx.address.create({
        data: { city_id: city.id, postal_code: '000000', street: 'Virtual Campus' },
      });
      school = await tx.school.create({
        data: {
          board_id: board.id,
          name: OPEN_LEARNING.SCHOOL_NAME,
          address_id: schoolAddress.id,
          principal_name: 'Test Vista',
          email: 'open-learning@testvista.in',
          contact_number: '0000000000',
        },
      });
    }

    const schoolStandard = await tx.school_Standard.upsert({
      where: { school_id_standard_id: { school_id: school.id, standard_id: standard.id } },
      update: {},
      create: { school_id: school.id, standard_id: standard.id },
    });

    let institution = await tx.institution.findUnique({ where: { school_id: school.id } });
    if (!institution) {
      institution = await tx.institution.create({
        data: {
          institution_type: 'VIRTUAL',
          name: OPEN_LEARNING.SCHOOL_NAME,
          email: 'open-learning@testvista.in',
          school_id: school.id,
        },
      });
    }

    return { schoolStandard, institution };
  }

  /**
   * Open aspirant registration — no school required.
   * Creates User (STUDENT role) + Student (virtual open-learning school)
   * + Participant (ASPIRANT) + program enrollment. The Student bridge means
   * aspirants can be assigned tests and take exams like any student.
   */
  async registerAspirant(dto: RegisterAspirantDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email_id: dto.email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists. Please log in instead.');
    }

    if (dto.institution_id && dto.org_code?.trim()) {
      throw new BadRequestException('Provide either institution_id or org_code, not both');
    }

    const wantsOrg = !!(dto.institution_id || dto.org_code?.trim());
    // Coaching join does not require a school standard — aspirant student row uses Open Learning infra.
    // school_standard_id remains optional for school-style joins that want a specific standard.

    const program = await this.prisma.exam_Program.findUnique({
      where: { id: dto.exam_program_id },
      include: { exam_body: true },
    });
    if (!program) throw new NotFoundException(`Exam program ${dto.exam_program_id} not found`);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const { schoolStandard, institution } = await this.ensureOpenLearningInfra(tx);

      const user = await tx.user.create({
        data: {
          email_id: dto.email,
          password: hashedPassword,
          name: dto.name,
          contact_number: dto.contact_number,
          status: true,
        },
      });

      const studentRole = await tx.role.findFirst({ where: { role_name: 'STUDENT' } });
      if (studentRole) {
        await tx.user_Role.create({ data: { user_id: user.id, role_id: studentRole.id } });
      }

      const registrationCode = 'ASP-' + Date.now().toString(36).toUpperCase() + '-' + user.id;

      const student = await tx.student.create({
        data: {
          user_id: user.id,
          school_standard_id: schoolStandard.id,
          student_id: registrationCode,
        },
      });

      const participant = await tx.participant.create({
        data: {
          user_id: user.id,
          participant_type: 'ASPIRANT',
          // Keep aspirant on open-learning infra; coaching join is a separate pending membership
          institution_id: institution.id,
          exam_cohort_id: dto.exam_cohort_id,
          registration_code: registrationCode,
          student_id: student.id,
          participant_programs: { create: { exam_program_id: dto.exam_program_id } },
        },
        include: { participant_programs: { include: { exam_program: true } } },
      });

      return { user, participant, student };
    });

    let joinRequest: { message: string } | null = null;
    if (wantsOrg) {
      const schoolStandardId = dto.school_standard_id;
      if (schoolStandardId == null) {
        throw new BadRequestException('school_standard_id is required when joining an organization');
      }
      if (dto.org_code?.trim()) {
        joinRequest = await this.institutionService.requestCoachingJoinByCode(
          result.user.id,
          dto.org_code.trim(),
          schoolStandardId,
          dto.request_message,
        );
      } else if (dto.institution_id) {
        joinRequest = await this.institutionService.requestCoachingJoin(
          result.user.id,
          dto.institution_id,
          schoolStandardId,
          dto.request_message,
        );
      }
    }

    const access_token = this.jwtService.sign({
      sub: result.user.id,
      email_id: result.user.email_id,
      roles: ['STUDENT'],
    });

    return {
      message: joinRequest
        ? 'Aspirant registration successful. Coaching join request sent — waiting for admin approval.'
        : 'Aspirant registration successful',
      participant: {
        id: result.participant.id,
        name: result.user.name,
        email: result.user.email_id,
        registration_code: result.participant.registration_code,
        exam_program: program.name,
        exam_body: program.exam_body.name,
      },
      join_request: joinRequest ? { pending: true, message: joinRequest.message } : null,
      access_token,
      user: {
        id: result.user.id,
        email_id: result.user.email_id,
        roles: ['STUDENT'],
      },
    };
  }

  async findAll(filter: ParticipantFilterDto) {
    return this.prisma.participant.findMany({
      where: {
        ...(filter.participant_type ? { participant_type: filter.participant_type as any } : {}),
        ...(filter.institution_id ? { institution_id: filter.institution_id } : {}),
        ...(filter.exam_cohort_id ? { exam_cohort_id: filter.exam_cohort_id } : {}),
        ...(filter.exam_program_id
          ? { participant_programs: { some: { exam_program_id: filter.exam_program_id } } }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email_id: true, contact_number: true } },
        institution: { select: { id: true, name: true, institution_type: true } },
        exam_cohort: { select: { id: true, name: true } },
        participant_programs: { include: { exam_program: { include: { exam_body: true } } } },
        student: {
          select: {
            id: true,
            student_id: true,
            school_standard: { include: { school: { select: { name: true } }, standard: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const participant = await this.prisma.participant.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email_id: true } },
        institution: true,
        exam_cohort: true,
        participant_programs: { include: { exam_program: { include: { exam_body: true } } } },
        student: true,
      },
    });
    if (!participant) throw new NotFoundException(`Participant ${id} not found`);
    return participant;
  }

  async findByUserId(userId: number) {
    return this.prisma.participant.findMany({
      where: { user_id: userId },
      include: {
        institution: { select: { id: true, name: true, institution_type: true } },
        exam_cohort: { select: { id: true, name: true } },
        participant_programs: {
          include: {
            exam_program: {
              include: { exam_body: { include: { exam_category: true } }, exam_stages: true },
            },
          },
        },
      },
    });
  }

  async enrollProgram(dto: EnrollProgramDto) {
    await this.findOne(dto.participant_id);
    const existing = await this.prisma.participant_Program.findUnique({
      where: {
        participant_id_exam_program_id: {
          participant_id: dto.participant_id,
          exam_program_id: dto.exam_program_id,
        },
      },
    });
    if (existing) throw new ConflictException('Participant is already enrolled in this program');
    return this.prisma.participant_Program.create({
      data: dto,
      include: { exam_program: true },
    });
  }

  /** Self-service: an authenticated aspirant enrolls in an additional program. */
  async enrollMyProgram(userId: number, examProgramId: number) {
    const participant = await this.prisma.participant.findFirst({
      where: { user_id: userId, participant_type: 'ASPIRANT' },
    });
    if (!participant) throw new NotFoundException('Aspirant profile not found');
    return this.enrollProgram({ participant_id: participant.id, exam_program_id: examProgramId });
  }

  async assignCohort(participantId: number, cohortId: number, actorUserId?: number) {
    await this.findOne(participantId);
    const cohort = await this.prisma.exam_Cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new NotFoundException(`Cohort ${cohortId} not found`);

    if (actorUserId && cohort.institution_id) {
      const membership = await this.prisma.institution_Membership.findFirst({
        where: {
          user_id: actorUserId,
          institution_id: cohort.institution_id,
          status: 'active',
        },
      });
      if (!membership) {
        throw new BadRequestException('You must belong to the cohort\'s organization');
      }
    }

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: {
        exam_cohort_id: cohortId,
        ...(cohort.institution_id ? { institution_id: cohort.institution_id } : {}),
      },
      include: {
        exam_cohort: true,
        user: { select: { id: true, name: true, email_id: true } },
      },
    });

    // Auto-enroll coaching participant in the cohort's exam program (assignable-students).
    if (cohort.exam_program_id) {
      await this.prisma.participant_Program.upsert({
        where: {
          participant_id_exam_program_id: {
            participant_id: participantId,
            exam_program_id: cohort.exam_program_id,
          },
        },
        create: {
          participant_id: participantId,
          exam_program_id: cohort.exam_program_id,
        },
        update: {},
      });
    }

    return updated;
  }

  /**
   * Students assignable to a competitive/entrance paper: program-enrolled
   * learners in the teacher's organization who sit in a cohort the teacher teaches.
   */
  async getAssignableStudents(examProgramId: number, teacherId: number) {
    const teacherOrg = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: teacherId,
        status: 'active',
      },
      select: { institution_id: true },
    });
    if (!teacherOrg) {
      return [];
    }

    const teacherCohorts = await this.prisma.teacher_Exam_Cohort.findMany({
      where: {
        user_id: teacherId,
        exam_cohort: {
          exam_program_id: examProgramId,
          OR: [
            { institution_id: teacherOrg.institution_id },
            { institution_id: null },
          ],
        },
      },
      select: { exam_cohort_id: true },
    });
    if (!teacherCohorts.length) {
      return [];
    }
    const cohortIds = teacherCohorts.map((c) => c.exam_cohort_id);

    const participants = await this.prisma.participant.findMany({
      where: {
        exam_cohort_id: { in: cohortIds },
        participant_programs: { some: { exam_program_id: examProgramId } },
        status: 'active',
        user: {
          learner_memberships: {
            some: {
              institution_id: teacherOrg.institution_id,
              status: 'active',
            },
          },
        },
        OR: [
          { student_id: { not: null } },
          { user: { student: { isNot: null } } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email_id: true,
            student: { select: { id: true, student_id: true } },
          },
        },
        student: { select: { id: true, student_id: true } },
        exam_cohort: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return participants
      .map((p) => {
        const student = p.student || p.user.student;
        if (!student) return null;
        return {
          id: student.id,
          participant_id: p.id,
          name: p.user.name,
          registration_code: p.registration_code ?? student.student_id,
          email: p.user.email_id,
          participant_type: p.participant_type,
          exam_cohort_id: p.exam_cohort?.id ?? null,
          exam_cohort_name: p.exam_cohort?.name ?? null,
        };
      })
      .filter(Boolean);
  }
}
