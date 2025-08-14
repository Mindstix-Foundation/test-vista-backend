import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ConflictException, 
  InternalServerErrorException, 
  BadRequestException,
  UnprocessableEntityException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { UserExistsException } from './exceptions/user-exists.exception';
import { toTitleCase } from '../../utils/titleCase';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';
import { AddTeacherDto } from './dto/add-teacher.dto';
import { RoleService } from '../role/role.service';

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
    private readonly roleService: RoleService
  ) {}

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
      
      // Filter by school ID if provided
      if (schoolId) {
        where.user_schools = {
          some: { school_id: schoolId }
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
      
      // Add search condition for school name
      if (schoolSearch) {
        where.user_schools = {
          some: {
            school: {
              name: {
                contains: schoolSearch,
                mode: 'insensitive'
              }
            }
          }
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
          user_schools: {
            select: {
              school: {
                select: {
                  name: true
                }
              }
            }
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
        schools: user.user_schools.map(us => us.school.name),
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
          user_schools: {
            select: {
              school: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
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
        schools: user.user_schools.map(us => ({
          id: us.school.id,
          name: us.school.name
        })),
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
          user_schools: {
            include: {
              school: true
            }
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

      // Get counts of related entities for informative message
      const relatedCounts = {
        roles: user.user_roles.length,
        schools: new Set(user.user_schools.map(us => us.school_id)).size,
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
        - Schools: ${user.user_schools.map(us => us.school.name).join(', ')}
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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
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
        user_schools: {
          include: {
            school: {
              include: {
                board: true
              }
            }
          }
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
      
      // Filter by school ID if provided
      if (schoolId) {
        where.user_schools = {
          some: { school_id: schoolId }
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
      
      // Add search condition for school name
      if (schoolSearch) {
        where.user_schools = {
          some: {
            school: {
              name: {
                contains: schoolSearch,
                mode: 'insensitive'
              }
            }
          }
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.UserOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get all users with sorting but without pagination - only select essential fields
      const users = await this.prisma.user.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          status: true,
          user_schools: {
            select: {
              school: {
                select: {
                  name: true
                }
              }
            }
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
        schools: user.user_schools.map(us => us.school.name),
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
        
        // Assign teacher to school
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
      const foundIds = validSchoolStandards.map(ss => ss.id);
      const invalidIds = schoolStandardIds.filter(id => !foundIds.includes(id));
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
   * Assigns teacher to a school
   */
  private async assignTeacherToSchool(prisma, userId: number, addTeacherDto: AddTeacherDto) {
    return prisma.user_School.create({
      data: {
        user_id: userId,
        school_id: addTeacherDto.school_id,
        start_date: addTeacherDto.start_date,
        end_date: addTeacherDto.end_date || null
      }
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
        user_schools: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1,
          include: {
            school: true
          }
        }
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
   * Gets school information from teacher data or existing user
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
    else if (existingUser.user_schools.length > 0) {
      const existingSchool = existingUser.user_schools[0].school;
      return await this.prisma.school.findUnique({
        where: { id: existingSchool.id },
        include: {
          school_instruction_mediums: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
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
      const foundIds = validSchoolStandards.map(ss => ss.id);
      const invalidIds = schoolStandardIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Invalid school-standard IDs for the specified school: ${invalidIds.join(', ')}`);
    }
    
    return validSchoolStandards;
  }

  /**
   * Updates or creates teacher school assignment
   */
  private async updateTeacherSchoolAssignment(prisma, userId: number, teacherData: any) {
    // Check if there's already a school assignment
    const existingSchoolAssignment = await prisma.user_School.findFirst({
      where: {
        user_id: userId,
        school_id: teacherData.school_id
      }
    });

    if (existingSchoolAssignment) {
      // Update existing assignment
      await prisma.user_School.update({
        where: { id: existingSchoolAssignment.id },
        data: {
          start_date: teacherData.start_date || existingSchoolAssignment.start_date,
          end_date: teacherData.end_date !== undefined 
            ? teacherData.end_date 
            : existingSchoolAssignment.end_date
        }
      });
    } else {
      // Create new assignment
      await prisma.user_School.create({
        data: {
          user_id: userId,
          school_id: teacherData.school_id,
          start_date: teacherData.start_date || new Date(),
          end_date: teacherData.end_date || null
        }
      });
    }
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
    // Get the latest school assignment
    const latestSchoolAssignment = await prisma.user_School.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        school: true
      }
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
      school: latestSchoolAssignment?.school.name || 'Not Assigned',
      assigned_standards: currentStandards.map(ts => ts.school_standard.standard.name),
      message: 'Teacher updated successfully'
    };
  }
} 