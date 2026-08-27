import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ConflictException, 
  InternalServerErrorException, 
  BadRequestException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { hash, compare } from 'bcryptjs';
import { Prisma } from '../../prisma/client';
import { UserExistsException } from './exceptions/user-exists.exception';
import { toTitleCase } from '../../utils/titleCase';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';
import { AddTeacherDto } from './dto/add-teacher.dto';
import { RegisterTeacherDto, RegisterStudentDto, UpdateTeacherCurriculumScopeDto } from './dto/register-teacher.dto';
import { DeleteMyAccountDto } from './dto/delete-account.dto';
import { RoleService } from '../role/role.service';
import { InstitutionService } from '../institution/institution.service';
import {
  OrgMembershipStatus,
  OrgMemberRole,
  generateOrgCode,
  activeTeacherMembershipInclude,
  schoolIdFromMembership,
} from '../../common/utils/org-membership.util';
import { InstitutionType, InstitutionVisibility } from '../../generated/prisma/client';
import { OPEN_LEARNING } from '../participant/participant.service';
import { randomHexToken } from '../../common/utils/secure-random.util';
import { isWellFormedEmail } from '../../common/utils/email.util';

/**
 * User search parameters for findAll method
 */
export class UserSearchParams {
  schoolId?: number;
  roleId?: number;
  page?: number = 1;
  page_size?: number = 15;
  sort_by?: SortField = SortField.NAME;
  sort_order?: SortOrder = SortOrder.ASC;
  search?: string;
  schoolSearch?: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly institutionService: InstitutionService,
  ) {}

  /**
   * Public teacher self-registration (no school/org required).
   * Optional pending join request when institution_id or org_code provided.
   * Returns JWT so the FE can auto-login like aspirant registration.
   */
  async registerTeacher(dto: RegisterTeacherDto) {
    if (!this.isValidEmail(dto.email_id)) {
      throw new BadRequestException('Invalid email format');
    }

    if (dto.institution_id && dto.org_code?.trim()) {
      throw new BadRequestException('Provide either institution_id or org_code, not both');
    }

    const scopeRows = await this.validateAndFlattenCurriculumScopes(dto.board_id, dto.scopes);

    const existingUser = await this.prisma.user.findUnique({
      where: { email_id: dto.email_id },
    });
    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Please log in instead.',
      );
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const teacherRoleId = await this.roleService.getRoleIdByName('TEACHER');

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: toTitleCase(dto.name),
          email_id: dto.email_id.trim().toLowerCase(),
          password: hashedPassword,
          contact_number: dto.contact_number,
          highest_qualification: dto.highest_qualification?.trim() || null,
          status: true,
        },
      });

      await tx.user_Role.create({
        data: {
          user_id: created.id,
          role_id: teacherRoleId,
        },
      });

      await tx.teacher_Curriculum_Scope.createMany({
        data: scopeRows.map((row) => ({
          user_id: created.id,
          board_id: row.board_id,
          standard_id: row.standard_id,
          subject_id: row.subject_id,
        })),
      });

      return created;
    });

    let joinRequest: { message: string; membership?: unknown } | null = null;
    if (dto.org_code?.trim()) {
      joinRequest = await this.institutionService.requestJoinByCode(
        user.id,
        dto.org_code.trim(),
        dto.request_message,
      );
    } else if (dto.institution_id) {
      joinRequest = await this.institutionService.requestJoin(
        user.id,
        dto.institution_id,
        dto.request_message,
      );
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email_id: user.email_id,
      roles: ['TEACHER'],
    });

    this.logger.log(`Teacher self-registered: ${user.email_id} (id=${user.id})`);

    return {
      message: joinRequest
        ? 'Teacher registration successful. Join request sent — waiting for organization admin approval.'
        : 'Teacher registration successful. You can create test papers now. Join or create a School / Coaching Center to assign tests to students.',
      access_token,
      join_request: joinRequest
        ? { pending: true, message: joinRequest.message }
        : null,
      user: {
        id: user.id,
        name: user.name,
        email_id: user.email_id,
        contact_number: user.contact_number,
        highest_qualification: user.highest_qualification,
      },
    };
  }

  /**
   * Replace teacher curriculum scope (create-paper). Does not touch org Teacher_Subject rows.
   */
  async updateMyCurriculumScope(userId: number, dto: UpdateTeacherCurriculumScopeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { user_roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const isTeacher = user.user_roles.some((ur) => ur.role.role_name === 'TEACHER');
    if (!isTeacher) {
      throw new BadRequestException('Only teachers can update curriculum scope');
    }

    const scopeRows = await this.validateAndFlattenCurriculumScopes(dto.board_id, dto.scopes);

    await this.prisma.$transaction(async (tx) => {
      await tx.teacher_Curriculum_Scope.deleteMany({ where: { user_id: userId } });
      await tx.teacher_Curriculum_Scope.createMany({
        data: scopeRows.map((row) => ({
          user_id: userId,
          board_id: row.board_id,
          standard_id: row.standard_id,
          subject_id: row.subject_id,
        })),
      });
    });

    // If teacher is in an active org, refresh Teacher_Subject from new scope
    const membership = await this.prisma.institution_Membership.findFirst({
      where: { user_id: userId, status: OrgMembershipStatus.active },
      include: { institution: { select: { school_id: true } } },
    });
    if (membership?.institution?.school_id) {
      await this.institutionService.mapCurriculumScopeToTeacherSubjects(
        userId,
        membership.institution.school_id,
      );
    }

    return {
      message: 'Curriculum scope updated',
      curriculum_scope: await this.getCurriculumScopeForUser(userId),
    };
  }

  async getCurriculumScopeForUser(userId: number) {
    const rows = await this.prisma.teacher_Curriculum_Scope.findMany({
      where: { user_id: userId },
      include: {
        board: { select: { id: true, name: true, abbreviation: true } },
        standard: { select: { id: true, name: true, sequence_number: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: [
        { standard: { sequence_number: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    });
    if (!rows.length) return null;

    const board = rows[0].board;
    const standardsMap = new Map<number, { id: number; name: string; sequence_number: number; subjects: { id: number; name: string }[] }>();
    for (const row of rows) {
      let standardEntry = standardsMap.get(row.standard_id);
      if (!standardEntry) {
        standardEntry = {
          id: row.standard.id,
          name: row.standard.name,
          sequence_number: row.standard.sequence_number,
          subjects: [],
        };
        standardsMap.set(row.standard_id, standardEntry);
      }
      standardEntry.subjects.push({
        id: row.subject.id,
        name: row.subject.name,
      });
    }

    return {
      board,
      standards: Array.from(standardsMap.values()),
      items: rows.map((r) => ({
        id: r.id,
        board_id: r.board_id,
        standard_id: r.standard_id,
        subject_id: r.subject_id,
        standard: r.standard,
        subject: r.subject,
      })),
    };
  }

  private async validateAndFlattenCurriculumScopes(
    boardId: number,
    scopes: { standard_id: number; subject_ids: number[] }[],
  ): Promise<{ board_id: number; standard_id: number; subject_id: number }[]> {
    if (!scopes?.length) {
      throw new BadRequestException('At least one standard with subjects is required');
    }

    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException(`Board ${boardId} not found`);

    const standardIds = [...new Set(scopes.map((s) => s.standard_id))];
    const standards = await this.prisma.standard.findMany({
      where: { id: { in: standardIds }, board_id: boardId },
    });
    if (standards.length !== standardIds.length) {
      throw new BadRequestException('One or more standards are invalid for the selected board');
    }

    const allSubjectIds = [...new Set(scopes.flatMap((s) => s.subject_ids || []))];
    if (!allSubjectIds.length) {
      throw new BadRequestException('At least one subject is required');
    }
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: allSubjectIds }, board_id: boardId },
    });
    if (subjects.length !== allSubjectIds.length) {
      throw new BadRequestException('One or more subjects are invalid for the selected board');
    }

    const rows: { board_id: number; standard_id: number; subject_id: number }[] = [];
    const seen = new Set<string>();
    for (const scope of scopes) {
      if (!scope.subject_ids?.length) {
        throw new BadRequestException(
          `Standard ${scope.standard_id} must include at least one subject`,
        );
      }
      for (const subjectId of scope.subject_ids) {
        const key = `${scope.standard_id}:${subjectId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          board_id: boardId,
          standard_id: scope.standard_id,
          subject_id: subjectId,
        });
      }
    }
    return rows;
  }

  /**
   * Public student self-registration (email + password).
   * With org + school_standard_id → pending learner membership at that school.
   * Without org → Open Learning bridge (join a school later from the portal).
   */
  async registerStudent(dto: RegisterStudentDto) {
    const wantsOrg = this.validateRegisterStudentInput(dto);

    const existingUser = await this.prisma.user.findUnique({
      where: { email_id: dto.email_id.trim().toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Please log in instead.',
      );
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const studentRoleId = await this.roleService.getRoleIdByName('STUDENT');

    const { schoolStandardId, institutionId, requestMessage } = wantsOrg
      ? await this.resolveOrgRegistrationContext(dto)
      : await this.resolveOpenLearningRegistrationContext();

    const existingRoll = await this.prisma.student.findFirst({
      where: {
        student_id: dto.student_id.trim(),
        school_standard_id: schoolStandardId,
      },
    });
    if (existingRoll) {
      throw new ConflictException(
        `Student ID ${dto.student_id} already exists in this school-standard`,
      );
    }

    const result = await this.createRegisteredStudentRecords({
      dto,
      hashedPassword,
      studentRoleId,
      schoolStandardId,
      wantsOrg,
      institutionId,
      requestMessage,
    });

    const access_token = this.jwtService.sign({
      sub: result.user.id,
      email_id: result.user.email_id,
      roles: ['STUDENT'],
    });

    this.logger.log(`Student self-registered: ${result.user.email_id} (id=${result.user.id})`);

    return {
      message: wantsOrg
        ? 'Student registration successful. Join request sent — waiting for organization admin approval. Self-practice is available now.'
        : 'Student registration successful. You can join a school later from Organization.',
      access_token,
      join_request: wantsOrg ? { pending: true } : null,
      user: {
        id: result.user.id,
        name: result.user.name,
        email_id: result.user.email_id,
        contact_number: result.user.contact_number,
      },
      student: {
        id: result.student.id,
        student_id: result.student.student_id,
        status: result.student.status,
      },
    };
  }

  private validateRegisterStudentInput(dto: RegisterStudentDto): boolean {
    if (!this.isValidEmail(dto.email_id)) {
      throw new BadRequestException('Invalid email format');
    }
    if (dto.institution_id && dto.org_code?.trim()) {
      throw new BadRequestException('Provide either institution_id or org_code, not both');
    }

    const wantsOrg = !!(dto.institution_id || dto.org_code?.trim());
    if (wantsOrg && !dto.school_standard_id) {
      throw new BadRequestException(
        'school_standard_id is required when joining an organization',
      );
    }
    return wantsOrg;
  }

  private async resolveOrgRegistrationContext(dto: RegisterStudentDto): Promise<{
    schoolStandardId: number;
    institutionId: number;
    requestMessage: string | null;
  }> {
    const institution = await this.findRegistrationInstitution(dto);
    if (!institution?.is_active) {
      throw new NotFoundException('Organization not found or is closed');
    }
    if (!institution.school_id) {
      throw new BadRequestException('This organization has no linked school curriculum');
    }
    if (
      institution.visibility === InstitutionVisibility.PRIVATE &&
      !dto.org_code?.trim()
    ) {
      throw new BadRequestException(
        'This organization is private. Join using the org code instead.',
      );
    }

    const schoolStandardId = dto.school_standard_id;
    if (schoolStandardId == null) {
      throw new BadRequestException(
        'school_standard_id is required when joining an organization',
      );
    }
    const schoolStandard = await this.prisma.school_Standard.findFirst({
      where: {
        id: schoolStandardId,
        school_id: institution.school_id,
      },
    });
    if (!schoolStandard) {
      throw new BadRequestException(
        'Selected standard is not offered by this organization',
      );
    }

    return {
      schoolStandardId: schoolStandard.id,
      institutionId: institution.id,
      requestMessage: dto.request_message?.trim() || null,
    };
  }

  private async findRegistrationInstitution(dto: RegisterStudentDto) {
    if (dto.institution_id) {
      return this.prisma.institution.findUnique({ where: { id: dto.institution_id } });
    }
    if (!dto.org_code?.trim()) {
      return null;
    }
    return (
      (await this.prisma.institution.findUnique({
        where: { org_code: dto.org_code.trim().toUpperCase() },
      })) ||
      (await this.prisma.institution.findFirst({
        where: { org_code: { equals: dto.org_code.trim(), mode: 'insensitive' } },
      }))
    );
  }

  private async resolveOpenLearningRegistrationContext(): Promise<{
    schoolStandardId: number;
    institutionId: null;
    requestMessage: string | null;
  }> {
    const open = await this.prisma.$transaction(async (tx) =>
      this.ensureOpenLearningInfra(tx),
    );
    return {
      schoolStandardId: open.schoolStandard.id,
      institutionId: null,
      requestMessage: null,
    };
  }

  private async createRegisteredStudentRecords(params: {
    dto: RegisterStudentDto;
    hashedPassword: string;
    studentRoleId: number;
    schoolStandardId: number;
    wantsOrg: boolean;
    institutionId: number | null;
    requestMessage: string | null;
  }) {
    const {
      dto,
      hashedPassword,
      studentRoleId,
      schoolStandardId,
      wantsOrg,
      institutionId,
      requestMessage,
    } = params;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email_id: dto.email_id.trim().toLowerCase(),
          password: hashedPassword,
          name: toTitleCase(dto.name),
          contact_number: dto.contact_number,
          status: true,
        },
      });

      await tx.user_Role.create({
        data: { user_id: user.id, role_id: studentRoleId },
      });

      const student = await tx.student.create({
        data: {
          user_id: user.id,
          student_id: dto.student_id.trim(),
          school_standard_id: schoolStandardId,
          status: wantsOrg ? 'pending' : 'active',
        },
      });

      let membership = null;
      if (wantsOrg && institutionId) {
        membership = await tx.learner_Institution_Membership.create({
          data: {
            user_id: user.id,
            institution_id: institutionId,
            student_id: student.id,
            school_standard_id: schoolStandardId,
            status: OrgMembershipStatus.pending,
            request_message: requestMessage,
          },
        });
      }

      return { user, student, membership };
    });
  }

  /** Idempotent Open Learning board/school/standard (shared with aspirants). */
  private async ensureOpenLearningInfra(tx: any) {
    let board = await tx.board.findUnique({ where: { abbreviation: OPEN_LEARNING.BOARD_ABBR } });
    if (!board) {
      let city = await tx.city.findFirst();
      if (!city) {
        const country = await tx.country.create({ data: { name: 'India' } });
        const state = await tx.state.create({
          data: { country_id: country.id, name: 'Maharashtra' },
        });
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
        where: {
          board_id_instruction_medium: { board_id: board.id, instruction_medium: 'English' },
        },
        update: {},
        create: { board_id: board.id, instruction_medium: 'English' },
      });
    }

    let standard = await tx.standard.findFirst({
      where: { board_id: board.id, name: OPEN_LEARNING.STANDARD_NAME },
    });
    if (!standard) {
      standard = await tx.standard.create({
        data: {
          board_id: board.id,
          name: OPEN_LEARNING.STANDARD_NAME,
          sequence_number: 1,
        },
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
          org_code: generateOrgCode('TV-OL'),
          visibility: InstitutionVisibility.PRIVATE,
          is_active: true,
        },
      });
    }

    return { schoolStandard, institution };
  }

  async create(createDto: CreateUserDto) {
    try {
      // Validate email format
      if (!this.isValidEmail(createDto.email_id)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check for existing email
      const existingUser = await this.prisma.user.findUnique({
        where: { email_id: createDto.email_id }
      });

      if (existingUser) {
        throw new UserExistsException(createDto.email_id);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(createDto.password);

      const user = await this.prisma.user.create({
        data: {
          ...createDto,
          name: toTitleCase(createDto.name),
          password: hashedPassword,
          contact_number: createDto.contact_number,
          alternate_contact_number: createDto.alternate_contact_number || null,
        }
      });

      return user;
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UserExistsException) {
        throw error;
      }
      this.logger.error('Failed to create user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll(params: UserSearchParams) {
    try {
      const { 
        schoolId, 
        roleId, 
        page = 1, 
        page_size = 15, 
        sort_by = SortField.NAME, 
        sort_order = SortOrder.ASC, 
        search, 
        schoolSearch 
      } = params;
      
      const skip = (page - 1) * page_size;
      
      // Build where clause
      let where: Prisma.UserWhereInput = {};
      
      // Filter by school ID via institution memberships
      if (schoolId) {
        where.institution_memberships = {
          some: {
            status: OrgMembershipStatus.active,
            institution: { school_id: schoolId },
          },
        };
      }
      
      // Filter by role ID if provided
      if (roleId) {
        where.user_roles = {
          some: { role_id: roleId }
        };
      }
      
      // Add search condition for user name
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }
      
      // Add search condition for school name via institution memberships
      if (schoolSearch) {
        where.institution_memberships = {
          some: {
            status: OrgMembershipStatus.active,
            institution: {
              school: {
                name: {
                  contains: schoolSearch,
                  mode: 'insensitive',
                },
              },
            },
          },
        };
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.user.count({ where });
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.UserOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get paginated data with sorting - only select essential fields
      const users = await this.prisma.user.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          status: true,
          institution_memberships: {
            where: { status: OrgMembershipStatus.active },
            select: {
              institution: {
                select: {
                  school: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          user_roles: {
            select: {
              role: {
                select: {
                  role_name: true
                }
              }
            }
          }
        }
      });
      
      // Transform the data to match the UserListDto format
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        schools: user.institution_memberships
          .map(m => m.institution?.school?.name)
          .filter((name): name is string => name != null),
        roles: user.user_roles.map(ur => ur.role.role_name),
        status: user.status
      }));
      
      return {
        data: formattedUsers,
        meta: {
          total,
          page,
          page_size,
          total_pages: Math.ceil(total / page_size),
          sort_by,
          sort_order,
          search: search || undefined,
          schoolSearch: schoolSearch || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch users:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email_id: true,
          contact_number: true,
          alternate_contact_number: true,
          highest_qualification: true,
          status: true,
          created_at: true,
          updated_at: true,
          user_roles: {
            select: {
              role: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          },
          institution_memberships: {
            where: { status: OrgMembershipStatus.active },
            select: {
              institution: {
                select: {
                  school: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          teacher_subjects: {
            select: {
              id: true,
              school_standard: {
                select: {
                  id: true,
                  standard: {
                    select: {
                      id: true,
                      name: true,
                      sequence_number: true
                    }
                  }
                }
              },
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: [
              {
                school_standard: {
                  standard: {
                    sequence_number: 'asc'
                  }
                }
              },
              {
                subject: {
                  name: 'asc'
                }
              }
            ]
          }
        }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Transform the response to a more readable format
      return {
        id: user.id,
        name: user.name,
        email_id: user.email_id,
        contact_number: user.contact_number,
        alternate_contact_number: user.alternate_contact_number,
        highest_qualification: user.highest_qualification,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        roles: user.user_roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.role_name
        })),
        schools: user.institution_memberships
          .map(m => m.institution?.school)
          .filter((s): s is { id: number; name: string } => s != null)
          .map(s => ({ id: s.id, name: s.name })),
        teaching_assignments: user.teacher_subjects.map(ts => ({
          id: ts.id,
          standard: {
            id: ts.school_standard.standard.id,
            name: ts.school_standard.standard.name,
            sequence_number: ts.school_standard.standard.sequence_number
          },
          subject: {
            id: ts.subject.id,
            name: ts.subject.name
          }
        }))
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch user ${id}:`, error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: number, updateDto: UpdateUserDto) {
    try {
      if (updateDto.email_id) {
        if (!this.isValidEmail(updateDto.email_id)) {
          throw new BadRequestException('Invalid email format');
        }

        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email_id: updateDto.email_id,
            NOT: { id }
          }
        });

        if (existingUser) {
          throw new UserExistsException(updateDto.email_id);
        }
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateDto,
          name: updateDto.name ? toTitleCase(updateDto.name) : undefined,
          contact_number: updateDto.contact_number,
          alternate_contact_number: updateDto.alternate_contact_number || null,
        },
        select: {
          id: true,
          name: true,
          email_id: true,
          contact_number: true,
          alternate_contact_number: true,
          highest_qualification: true,
          status: true,
          created_at: true,
          updated_at: true
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof UserExistsException) {
        throw error;
      }
      this.logger.error(`Failed to update user ${id}:`, error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if user exists with its relationships
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          user_roles: {
            include: {
              role: true
            }
          },
          institution_memberships: {
            where: { status: OrgMembershipStatus.active },
            include: {
              institution: {
                include: { school: true },
              },
            },
          },
          teacher_subjects: {
            include: {
              school_standard: {
                include: {
                  school: true,
                  standard: true
                }
              },
              subject: true
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const schoolNames = user.institution_memberships
        .map(m => m.institution?.school?.name)
        .filter((n): n is string => n != null);

      // Get counts of related entities for informative message
      const relatedCounts = {
        roles: user.user_roles.length,
        schools: new Set(
          user.institution_memberships
            .map(m => schoolIdFromMembership(m))
            .filter((id): id is number => id != null)
        ).size,
        teachingAssignments: user.teacher_subjects.length,
        uniqueSubjects: new Set(user.teacher_subjects.map(ts => 
          ts.subject.name
        )).size
      };

      // Log what will be deleted
      this.logger.log(`Deleting user ${id} (${user.name}) will also delete:
        - ${relatedCounts.roles} role assignments
        - ${relatedCounts.schools} school associations
        - ${relatedCounts.teachingAssignments} teaching assignments
        
        Details:
        - Roles: ${user.user_roles.map(ur => ur.role.role_name).join(', ')}
        - Schools: ${schoolNames.join(', ')}
        - Teaching: ${user.teacher_subjects.map(ts => 
          `${ts.subject.name} at ${ts.school_standard.school.name}`
        ).join(', ')}
        `);

      // Delete the user - cascade will handle all related records
      await this.prisma.user.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted user ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * Preconditions for self-serve account deletion (teacher org admin / last-teacher gates).
   */
  async getDeleteAccountStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const roles = user.user_roles.map((ur) => ur.role.role_name);
    if (roles.includes('ADMIN')) {
      return {
        allowed: false,
        reason: 'Platform admin accounts cannot be self-deleted.',
        roles,
        org: null,
      };
    }

    const isTeacher = roles.includes('TEACHER');
    if (!isTeacher) {
      return {
        allowed: true,
        roles,
        org: null,
        requires: { mode: 'simple' as const },
      };
    }

    const membership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
      include: {
        institution: { select: { id: true, name: true, org_code: true, is_active: true } },
      },
    });

    if (!membership || membership.status === OrgMembershipStatus.pending) {
      return {
        allowed: true,
        roles,
        org: membership
          ? {
              institution_id: membership.institution.id,
              name: membership.institution.name,
              membership_status: membership.status,
              member_role: membership.member_role,
              is_sole_admin: false,
              is_last_teacher: false,
              other_teachers: [],
            }
          : null,
        requires: { mode: 'simple' as const },
      };
    }

    const otherTeachers = await this.prisma.institution_Membership.findMany({
      where: {
        institution_id: membership.institution_id,
        status: OrgMembershipStatus.active,
        user_id: { not: userId },
      },
      include: {
        user: { select: { id: true, name: true, email_id: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const adminCount = await this.prisma.institution_Membership.count({
      where: {
        institution_id: membership.institution_id,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
    });

    const isAdmin = membership.member_role === OrgMemberRole.ADMIN;
    const isSoleAdmin = isAdmin && adminCount <= 1;
    const isLastTeacher = otherTeachers.length === 0;

    let requires: { mode: 'simple' | 'transfer_admin' | 'delete_org'; modes?: string[] };
    if (isSoleAdmin && isLastTeacher) {
      requires = { mode: 'delete_org', modes: ['delete_org'] };
    } else if (isSoleAdmin) {
      requires = {
        mode: 'transfer_admin',
        modes: ['transfer_admin', 'delete_org'],
      };
    } else {
      requires = { mode: 'simple' };
    }

    return {
      allowed: true,
      roles,
      org: {
        institution_id: membership.institution.id,
        name: membership.institution.name,
        membership_status: membership.status,
        member_role: membership.member_role,
        is_sole_admin: isSoleAdmin,
        is_last_teacher: isLastTeacher,
        other_teachers: otherTeachers.map((m) => ({
          membership_id: m.id,
          user_id: m.user.id,
          name: m.user.name,
          email_id: m.user.email_id,
          member_role: m.member_role,
        })),
      },
      requires,
    };
  }

  /**
   * Self-serve hard-delete account (teachers, students, aspirants). Platform ADMIN out of scope.
   */
  async deleteMyAccount(userId: number, dto: DeleteMyAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const roles = new Set(user.user_roles.map((ur) => ur.role.role_name));
    // Platform ADMIN out of scope (even if somehow combined with other roles)
    if (roles.has('ADMIN')) {
      throw new ForbiddenException('Platform admin accounts cannot be self-deleted');
    }

    const passwordOk = await compare(dto.password, user.password);
    if (!passwordOk) {
      throw new BadRequestException('Password is incorrect');
    }

    const isTeacher = roles.has('TEACHER');
    if (isTeacher) {
      await this.handleTeacherOrgBeforeAccountDelete(userId, dto);
    }

    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.log(`User ${userId} self-deleted their account`);
    return { message: 'Your account has been permanently deleted.' };
  }

  private async handleTeacherOrgBeforeAccountDelete(userId: number, dto: DeleteMyAccountDto) {
    const membership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: { in: [OrgMembershipStatus.pending, OrgMembershipStatus.active] },
      },
      include: { institution: { select: { id: true, name: true } } },
    });

    if (!membership) {
      return; // free teacher
    }

    if (membership.status === OrgMembershipStatus.pending) {
      await this.institutionService.leaveMyMembership(userId);
      return;
    }

    const otherTeachers = await this.prisma.institution_Membership.findMany({
      where: {
        institution_id: membership.institution_id,
        status: OrgMembershipStatus.active,
        user_id: { not: userId },
      },
      select: { id: true, user_id: true },
    });

    const adminCount = await this.prisma.institution_Membership.count({
      where: {
        institution_id: membership.institution_id,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
      },
    });

    const isSoleAdmin =
      membership.member_role === OrgMemberRole.ADMIN && adminCount <= 1;
    const isLastTeacher = otherTeachers.length === 0;

    if (isSoleAdmin && isLastTeacher) {
      await this.deleteOrgAsSoleAdminLastTeacher(userId, dto, membership.institution_id);
      return;
    }

    if (isSoleAdmin) {
      await this.handleSoleAdminTeacherAccountDelete(
        userId,
        dto,
        membership.institution_id,
        otherTeachers,
      );
      return;
    }

    await this.institutionService.leaveMyMembership(userId);
  }

  private async deleteOrgAsSoleAdminLastTeacher(
    userId: number,
    dto: DeleteMyAccountDto,
    institutionId: number,
  ) {
    const mode = dto.mode || 'simple';
    if (mode !== 'delete_org' || dto.confirm_delete_org !== true) {
      throw new BadRequestException(
        'You are the last teacher in this organization. Confirm organization deletion (mode=delete_org, confirm_delete_org=true) to delete your account.',
      );
    }
    await this.institutionService.hardDeleteForOrgAdmin(userId, institutionId);
  }

  private async handleSoleAdminTeacherAccountDelete(
    userId: number,
    dto: DeleteMyAccountDto,
    institutionId: number,
    otherTeachers: { id: number; user_id: number }[],
  ) {
    const mode = dto.mode || 'simple';
    if (mode === 'transfer_admin') {
      await this.transferAdminBeforeTeacherAccountDelete(userId, dto, otherTeachers);
      return;
    }
    if (mode === 'delete_org') {
      if (dto.confirm_delete_org !== true) {
        throw new BadRequestException('confirm_delete_org must be true to permanently delete the organization');
      }
      await this.institutionService.hardDeleteForOrgAdmin(userId, institutionId);
      return;
    }
    throw new BadRequestException(
      'You are the sole organization admin. Choose mode=transfer_admin (promote another teacher) or mode=delete_org.',
    );
  }

  private async transferAdminBeforeTeacherAccountDelete(
    userId: number,
    dto: DeleteMyAccountDto,
    otherTeachers: { id: number; user_id: number }[],
  ) {
    if (!dto.promote_membership_id) {
      throw new BadRequestException('promote_membership_id is required to transfer admin');
    }
    const target = otherTeachers.find((t) => t.id === dto.promote_membership_id);
    if (!target) {
      throw new BadRequestException(
        'Selected teacher is not an active member of your organization',
      );
    }
    await this.institutionService.promoteMemberToAdmin(userId, dto.promote_membership_id);
    await this.institutionService.leaveMyMembership(userId);
  }

  private isValidEmail(email: string): boolean {
    return isWellFormedEmail(email);
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await hash(password, 10);
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw new InternalServerErrorException('Failed to process password');
    }
  }

  private handleError(error: any, operation: string) {
    this.logger.error(`Failed to ${operation}:`, error);
    
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException || 
        error instanceof ConflictException ||
        error instanceof UnprocessableEntityException ||
        error instanceof UserExistsException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
    }

    throw new InternalServerErrorException(`Failed to ${operation}`);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email_id: email },
      include: {
        user_roles: {
          include: {
            role: true
          }
        },
        institution_memberships: {
          where: { status: OrgMembershipStatus.active },
          include: {
            ...activeTeacherMembershipInclude,
          },
        },
        teacher_subjects: {
          include: {
            school_standard: {
              include: {
                school: true,
                standard: true
              }
            },
            subject: true
          }
        },
        student: {
          include: {
            school_standard: {
              include: {
                school: {
                  include: {
                    board: true
                  }
                },
                standard: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findAllWithoutPagination(params: UserSearchParams) {
    try {
      const { 
        schoolId, 
        roleId, 
        sort_by = SortField.NAME, 
        sort_order = SortOrder.ASC, 
        search, 
        schoolSearch 
      } = params;
      
      // Build where clause
      let where: Prisma.UserWhereInput = {};
      
      // Filter by school ID via institution memberships
      if (schoolId) {
        where.institution_memberships = {
          some: {
            status: OrgMembershipStatus.active,
            institution: { school_id: schoolId },
          },
        };
      }
      
      // Filter by role ID if provided
      if (roleId) {
        where.user_roles = {
          some: { role_id: roleId }
        };
      }
      
      // Add search condition for user name
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }
      
      // Add search condition for school name via institution memberships
      if (schoolSearch) {
        where.institution_memberships = {
          some: {
            status: OrgMembershipStatus.active,
            institution: {
              school: {
                name: {
                  contains: schoolSearch,
                  mode: 'insensitive',
                },
              },
            },
          },
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.UserOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get all users with sorting but without pagination
      const users = await this.prisma.user.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          status: true,
          institution_memberships: {
            where: { status: OrgMembershipStatus.active },
            select: {
              institution: {
                select: {
                  school: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          user_roles: {
            select: {
              role: {
                select: {
                  role_name: true
                }
              }
            }
          }
        }
      });
      
      // Transform the data to match the UserListDto format
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        schools: user.institution_memberships
          .map(m => m.institution?.school?.name)
          .filter((name): name is string => name != null),
        roles: user.user_roles.map(ur => ur.role.role_name),
        status: user.status
      }));
      
      return {
        data: formattedUsers,
        meta: {
          sort_by,
          sort_order,
          search: search || undefined,
          schoolSearch: schoolSearch || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all users:', error);
      throw new InternalServerErrorException('Failed to fetch all users');
    }
  }

  async checkEmailAvailability(email: string) {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check if email exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email_id: email }
      });

      return {
        email,
        available: !existingUser,
        message: existingUser 
          ? `Email ${email} is already registered` 
          : `Email ${email} is available`
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to check email availability:', error);
      throw new InternalServerErrorException('Failed to check email availability');
    }
  }

  /**
   * Add a new teacher with school and subject assignments
   * 
   * This method handles the complete process of adding a teacher:
   * 1. Creating a user with TEACHER role
   * 2. Assigning the teacher to a school
   * 3. Creating teacher_subject entries for all valid medium-standard-subject combinations
   * 
   * The method performs several validations:
   * - Validates email format and checks for existing users
   * - Verifies the TEACHER role exists
   * - Confirms the school exists and has instruction mediums
   * - Validates that all school-standards belong to the specified school
   * - Verifies valid medium-standard-subject combinations exist
   * 
   * All operations are performed in a single transaction for data integrity.
   * 
   * @param addTeacherDto - Data transfer object containing all teacher information
   * @returns The created teacher with assignment details
   * @throws BadRequestException for validation errors
   * @throws NotFoundException if required entities are not found
   * @throws UserExistsException if email already exists
   * @throws InternalServerErrorException for other errors
   */
  async addTeacher(addTeacherDto: AddTeacherDto) {
    try {
      // Validate inputs
      await this.validateTeacherInput(addTeacherDto);

      // Get school with validated instruction mediums
      const { school, validSchoolStandards } = await this.validateSchoolAndStandards(addTeacherDto);

      // Execute all operations in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Create user and assign roles
        const user = await this.createTeacherUser(prisma, addTeacherDto);
        
        // Assign teacher to school via institution membership
        await this.assignTeacherToSchool(prisma, user.id, addTeacherDto);
        
        // Process subject assignments
        const teacherSubjects = await this.processSubjectAssignments(
          prisma, 
          user.id, 
          addTeacherDto.standard_subjects, 
          validSchoolStandards, 
          school
        );
        
        // Create teacher-subject entries
        await this.createTeacherSubjects(prisma, teacherSubjects);

        // Return the created user with role and school information
        return {
          id: user.id,
          name: user.name,
          email_id: user.email_id,
          contact_number: user.contact_number,
          alternate_contact_number: user.alternate_contact_number,
          highest_qualification: user.highest_qualification,
          status: user.status,
          role: 'TEACHER',
          school: school.name,
          assigned_standards: validSchoolStandards.map(ss => ss.standard.name),
          message: 'Teacher added successfully'
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof UserExistsException) {
        throw error;
      }
      this.logger.error('Failed to add teacher:', error);
      throw new InternalServerErrorException('Failed to add teacher');
    }
  }

  /**
   * Validates teacher input data
   */
  private async validateTeacherInput(addTeacherDto: AddTeacherDto): Promise<void> {
    // Validate email format
    if (!this.isValidEmail(addTeacherDto.email_id)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if a user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email_id: addTeacherDto.email_id }
    });

    if (existingUser) {
      throw new UserExistsException(addTeacherDto.email_id);
    }
  }

  /**
   * Validates school data and standard assignments
   */
  private async validateSchoolAndStandards(addTeacherDto: AddTeacherDto) {
    // Validate the school exists
    const school = await this.prisma.school.findUnique({
      where: { id: addTeacherDto.school_id },
      include: {
        school_instruction_mediums: {
          include: {
            instruction_medium: true
          }
        }
      }
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${addTeacherDto.school_id} not found`);
    }

    // Validate that the school has at least one instruction medium
    if (school.school_instruction_mediums.length === 0) {
      throw new BadRequestException(`School with ID ${addTeacherDto.school_id} has no instruction mediums`);
    }

    // Validate standard-subject combinations
    const schoolStandardIds = addTeacherDto.standard_subjects.map(ss => ss.schoolStandardId);

    // Check if all provided school-standards exist and belong to the specified school
    const validSchoolStandards = await this.prisma.school_Standard.findMany({
      where: {
        id: { in: schoolStandardIds },
        school_id: addTeacherDto.school_id
      },
      include: {
        standard: true
      }
    });

    if (validSchoolStandards.length !== schoolStandardIds.length) {
      const foundIds = new Set(validSchoolStandards.map(ss => ss.id));
      const invalidIds = schoolStandardIds.filter(id => !foundIds.has(id));
      throw new BadRequestException(`Invalid school-standard IDs for the specified school: ${invalidIds.join(', ')}`);
    }

    return { school, validSchoolStandards };
  }

  /**
   * Creates a new teacher user
   */
  private async createTeacherUser(prisma, addTeacherDto: AddTeacherDto) {
    const user = await prisma.user.create({
      data: {
        name: toTitleCase(addTeacherDto.name),
        email_id: addTeacherDto.email_id,
        password: await this.hashPassword(addTeacherDto.password),
        contact_number: addTeacherDto.contact_number,
        alternate_contact_number: addTeacherDto.alternate_contact_number || null,
        highest_qualification: addTeacherDto.highest_qualification || null,
        status: true
      }
    });

    // Assign the user to the TEACHER role
    await prisma.user_Role.create({
      data: {
        user_id: user.id,
        role_id: await this.roleService.getRoleIdByName('TEACHER')
      }
    });

    return user;
  }

  /**
   * Ensures an Institution record exists for the given school_id.
   * Creates one (type SCHOOL, visibility PRIVATE) if missing.
   */
  private async ensureInstitutionForSchool(prisma, schoolId: number) {
    let institution = await prisma.institution.findFirst({
      where: { school_id: schoolId },
    });

    if (!institution) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      const randomSuffix = randomHexToken(6);
      const orgCode = `TV-S${schoolId}-${randomSuffix}`;

      institution = await prisma.institution.create({
        data: {
          institution_type: InstitutionType.SCHOOL,
          name: school?.name ?? `School ${schoolId}`,
          email: school?.email ?? null,
          contact_number: school?.contact_number ?? null,
          principal_name: school?.principal_name ?? null,
          org_code: orgCode,
          visibility: InstitutionVisibility.PRIVATE,
          school_id: schoolId,
        },
      });
    }

    return institution;
  }

  /**
   * Assigns teacher to a school via Institution_Membership
   */
  private async assignTeacherToSchool(prisma, userId: number, addTeacherDto: AddTeacherDto) {
    const institution = await this.ensureInstitutionForSchool(prisma, addTeacherDto.school_id);
    const now = new Date();

    return prisma.institution_Membership.create({
      data: {
        user_id: userId,
        institution_id: institution.id,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
        requested_at: now,
        responded_at: now,
      },
    });
  }

  /**
   * Processes subject assignments for a teacher
   */
  private async processSubjectAssignments(
    prisma, 
    userId: number, 
    standardSubjects, 
    validSchoolStandards, 
    school
  ) {
    const teacherSubjects = [];

    for (const standardSubject of standardSubjects) {
      const { schoolStandardId, subjectIds } = standardSubject;
      await this.addSubjectsToTeacher(
        prisma, 
        userId, 
        schoolStandardId, 
        subjectIds, 
        school.board_id, 
        teacherSubjects
      );
    }

    return teacherSubjects;
  }

  /**
   * Adds subjects to a teacher
   */
  private async addSubjectsToTeacher(
    prisma, 
    userId: number, 
    schoolStandardId: number, 
    subjectIds: number[], 
    boardId: number, 
    teacherSubjects: any[]
  ) {
    for (const subjectId of subjectIds) {
      // Verify that the subject exists for this board
      const subject = await prisma.subject.findFirst({
        where: {
          id: subjectId,
          board_id: boardId
        }
      });

      if (!subject) {
        this.logger.warn(`Subject ${subjectId} not found or doesn't belong to the board of the school`);
        continue;
      }

      // Add teacher_subject entry
      teacherSubjects.push({
        user_id: userId,
        school_standard_id: schoolStandardId,
        subject_id: subjectId
      });
    }
  }

  /**
   * Creates teacher subject assignments
   */
  private async createTeacherSubjects(prisma, teacherSubjects: any[]) {
    if (teacherSubjects.length > 0) {
      await prisma.teacher_Subject.createMany({
        data: teacherSubjects
      });
    } else {
      throw new BadRequestException('No valid subject combinations found for the provided standards and subjects');
    }
  }

  /**
   * Edit an existing teacher with updated school and subject assignments
   * 
   * This method handles updating a teacher's information:
   * 1. Updates basic user details if provided
   * 2. Updates school assignment if school_id is provided
   * 3. Updates standard-subject assignments if standard_subjects are provided
   * 
   * The method performs several validations:
   * - Validates that the teacher exists and has the TEACHER role
   * - Validates email format and checks for existing users if email is changed
   * - If school is changed, verifies the new school exists and has instruction mediums
   * - If standard_subjects are provided, validates that all school-standards belong to the specified school
   * - Verifies valid medium-standard-subject combinations exist
   * 
   * All operations are performed in a single transaction for data integrity.
   * 
   * @param teacherData - Data transfer object containing teacher update information
   * @returns The updated teacher with assignment details
   * @throws BadRequestException for validation errors
   * @throws NotFoundException if required entities are not found
   * @throws UserExistsException if email already exists
   * @throws InternalServerErrorException for other errors
   */
  async editTeacher(teacherData: any) {
    try {
      // Validate teacher exists and has correct role
      const existingUser = await this.validateTeacherExists(teacherData.id);
      
      // Validate email if being updated
      await this.validateTeacherEmail(teacherData, existingUser);
      
      // Prepare user update data
      const updateData = await this.prepareTeacherUpdateData(teacherData);
      
      // Get and validate school information
      const { school, validSchoolStandards } = 
          await this.getSchoolAndValidateStandards(teacherData, existingUser);
      
      // Execute all operations in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Update the user
        const updatedUser = await prisma.user.update({
          where: { id: teacherData.id },
          data: updateData
        });
        
        // Handle school assignment if needed
        if (teacherData.school_id) {
          await this.updateTeacherSchoolAssignment(prisma, updatedUser.id, teacherData);
        }
        
        // Update subject assignments if provided
        if (teacherData.standard_subjects && teacherData.standard_subjects.length > 0) {
          await this.updateTeacherSubjects(
            prisma, 
            updatedUser.id, 
            teacherData.standard_subjects,
            validSchoolStandards,
            school
          );
        }
        
        // Return updated teacher details
        return await this.getUpdatedTeacherDetails(prisma, updatedUser.id);
      });
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof UserExistsException) {
        throw error;
      }
      this.logger.error('Failed to edit teacher:', error);
      throw new InternalServerErrorException('Failed to edit teacher');
    }
  }

  /**
   * Validates that the user exists and is a teacher
   */
  private async validateTeacherExists(userId: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: true
          }
        },
        institution_memberships: {
          where: { status: OrgMembershipStatus.active },
          include: {
            institution: {
              include: { school: true },
            },
          },
          orderBy: { created_at: 'desc' as const },
          take: 1,
        },
      }
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify that the user is a teacher
    const isTeacher = existingUser.user_roles.some(ur => ur.role.role_name === 'TEACHER');
    if (!isTeacher) {
      throw new BadRequestException(`User with ID ${userId} is not a teacher`);
    }

    return existingUser;
  }

  /**
   * Validates email if it's being updated
   */
  private async validateTeacherEmail(teacherData: any, existingUser: any) {
    if (teacherData.email_id && teacherData.email_id !== existingUser.email_id) {
      if (!this.isValidEmail(teacherData.email_id)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check if email is already taken by another user
      const userWithEmail = await this.prisma.user.findUnique({
        where: { email_id: teacherData.email_id }
      });

      if (userWithEmail && userWithEmail.id !== teacherData.id) {
        throw new UserExistsException(teacherData.email_id);
      }
    }
  }

  /**
   * Prepares data for user update
   */
  private async prepareTeacherUpdateData(teacherData: any): Promise<Prisma.UserUpdateInput> {
    const updateData: Prisma.UserUpdateInput = {};
    
    if (teacherData.name) {
      updateData.name = toTitleCase(teacherData.name);
    }
    
    if (teacherData.email_id) {
      updateData.email_id = teacherData.email_id;
    }
    
    if (teacherData.password) {
      updateData.password = await this.hashPassword(teacherData.password);
    }
    
    if (teacherData.contact_number) {
      updateData.contact_number = teacherData.contact_number;
    }
    
    if (teacherData.alternate_contact_number !== undefined) {
      updateData.alternate_contact_number = teacherData.alternate_contact_number || null;
    }
    
    if (teacherData.highest_qualification !== undefined) {
      updateData.highest_qualification = teacherData.highest_qualification || null;
    }
    
    if (teacherData.status !== undefined) {
      updateData.status = teacherData.status;
    }
    
    return updateData;
  }

  /**
   * Gets school information and validates standards if provided
   */
  private async getSchoolAndValidateStandards(teacherData: any, existingUser: any) {
    let school = null;
    let validSchoolStandards = [];
    
    // Get school information - either from teacherData or from existing user
    school = await this.getSchoolInfo(teacherData, existingUser);
    
    // Validate standard-subjects if provided
    if (teacherData.standard_subjects) {
      if (!school) {
        throw new BadRequestException('Cannot update standard-subject assignments without a school');
      }

      validSchoolStandards = await this.validateSchoolStandards(
        teacherData.standard_subjects, 
        school.id
      );
    }
    
    return { school, validSchoolStandards };
  }

  /**
   * Gets school information from teacher data or existing user's active membership
   */
  private async getSchoolInfo(teacherData: any, existingUser: any) {
    if (teacherData.school_id) {
      const school = await this.prisma.school.findUnique({
        where: { id: teacherData.school_id },
        include: {
          school_instruction_mediums: {
            include: {
              instruction_medium: true
            }
          }
        }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${teacherData.school_id} not found`);
      }

      if (school.school_instruction_mediums.length === 0) {
        throw new BadRequestException(`School with ID ${teacherData.school_id} has no instruction mediums`);
      }
      
      return school;
    } 
    else if (existingUser.institution_memberships?.length > 0) {
      const existingSchoolId = schoolIdFromMembership(existingUser.institution_memberships[0]);
      if (existingSchoolId) {
        return await this.prisma.school.findUnique({
          where: { id: existingSchoolId },
          include: {
            school_instruction_mediums: {
              include: {
                instruction_medium: true
              }
            }
          }
        });
      }
    }
    
    return null;
  }

  /**
   * Validates school standards for teacher assignment
   */
  private async validateSchoolStandards(standardSubjects: any[], schoolId: number) {
    const schoolStandardIds = standardSubjects.map(ss => ss.schoolStandardId);

    // Check if all provided school-standards exist and belong to the specified school
    const validSchoolStandards = await this.prisma.school_Standard.findMany({
      where: {
        id: { in: schoolStandardIds },
        school_id: schoolId
      },
      include: {
        standard: true
      }
    });

    if (validSchoolStandards.length !== schoolStandardIds.length) {
      const foundIds = new Set(validSchoolStandards.map(ss => ss.id));
      const invalidIds = schoolStandardIds.filter(id => !foundIds.has(id));
      throw new BadRequestException(`Invalid school-standard IDs for the specified school: ${invalidIds.join(', ')}`);
    }
    
    return validSchoolStandards;
  }

  /**
   * Updates teacher school assignment: marks previous active memberships as 'left'
   * and creates a new active membership for the new school's institution.
   */
  private async updateTeacherSchoolAssignment(prisma, userId: number, teacherData: any) {
    const now = new Date();

    // Mark all current active memberships for this user as 'left'
    await prisma.institution_Membership.updateMany({
      where: {
        user_id: userId,
        status: OrgMembershipStatus.active,
      },
      data: {
        status: OrgMembershipStatus.left,
        responded_at: now,
      },
    });

    // Ensure institution exists for the new school
    const institution = await this.ensureInstitutionForSchool(prisma, teacherData.school_id);

    // Create new active membership
    await prisma.institution_Membership.create({
      data: {
        user_id: userId,
        institution_id: institution.id,
        member_role: OrgMemberRole.ADMIN,
        status: OrgMembershipStatus.active,
        requested_at: now,
        responded_at: now,
      },
    });
  }

  /**
   * Updates teacher subject assignments
   */
  private async updateTeacherSubjects(
    prisma, 
    userId: number, 
    standardSubjects: any[],
    validSchoolStandards: any[],
    school: any
  ) {
    // Delete existing teacher_subject entries
    await prisma.teacher_Subject.deleteMany({
      where: { user_id: userId }
    });
    
    // Process new subject assignments
    const teacherSubjects = await this.buildTeacherSubjects(
      prisma,
      userId,
      standardSubjects,
      validSchoolStandards,
      school
    );
    
    // Create all teacher_subject entries in a batch operation
    if (teacherSubjects.length > 0) {
      await prisma.teacher_Subject.createMany({
        data: teacherSubjects
      });
    } else {
      throw new BadRequestException('No valid subject combinations found for the provided standards and subjects');
    }
  }

  /**
   * Builds teacher-subject mappings
   */
  private async buildTeacherSubjects(
    prisma,
    userId: number,
    standardSubjects: any[],
    validSchoolStandards: any[],
    school: any
  ) {
    const teacherSubjects = [];

    for (const standardSubject of standardSubjects) {
      const { schoolStandardId, subjectIds } = standardSubject;
      
      for (const subjectId of subjectIds) {
        // Verify that the subject exists for this board
        const subject = await prisma.subject.findFirst({
          where: {
            id: subjectId,
            board_id: school.board_id
          }
        });

        if (!subject) {
          this.logger.warn(`Subject ${subjectId} not found or doesn't belong to the board of the school`);
          continue;
        }

        // Add teacher_subject entry
        teacherSubjects.push({
          user_id: userId,
          school_standard_id: schoolStandardId,
          subject_id: subjectId
        });
      }
    }
    
    return teacherSubjects;
  }

  /**
   * Gets updated teacher details
   */
  private async getUpdatedTeacherDetails(prisma, userId: number) {
    // Get the latest active membership to resolve school
    const latestMembership = await prisma.institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: OrgMembershipStatus.active,
      },
      orderBy: { created_at: 'desc' },
      include: {
        institution: {
          include: { school: true },
        },
      },
    });

    // Get current standard assignments
    const currentStandards = await prisma.teacher_Subject.findMany({
      where: { user_id: userId },
      distinct: ['school_standard_id'],
      include: {
        school_standard: {
          include: {
            standard: true
          }
        }
      }
    });

    // Get updated user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email_id: true,
        contact_number: true,
        alternate_contact_number: true,
        highest_qualification: true,
        status: true
      }
    });

    // Return the updated teacher details
    return {
      id: user.id,
      name: user.name,
      email_id: user.email_id,
      contact_number: user.contact_number,
      alternate_contact_number: user.alternate_contact_number,
      highest_qualification: user.highest_qualification,
      status: user.status,
      role: 'TEACHER',
      school: latestMembership?.institution?.school?.name || 'Not Assigned',
      assigned_standards: currentStandards.map(ts => ts.school_standard.standard.name),
      message: 'Teacher updated successfully'
    };
  }
}
