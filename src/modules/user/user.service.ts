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
import { EditTeacherDto } from './dto/edit-teacher.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(
    schoolId?: number, 
    roleId?: number, 
    page = 1, 
    page_size = 15, 
    sort_by: SortField = SortField.NAME, 
    sort_order: SortOrder = SortOrder.ASC, 
    search?: string, 
    schoolSearch?: string
  ) {
    try {
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
              medium_standard_subject: {
                select: {
                  id: true,
                  subject: {
                    select: {
                      id: true,
                      name: true
                    }
                  },
                  instruction_medium: {
                    select: {
                      id: true,
                      instruction_medium: true
                    }
                  }
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
                medium_standard_subject: {
                  subject: {
                    name: 'asc'
                  }
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
            id: ts.medium_standard_subject.subject.id,
            name: ts.medium_standard_subject.subject.name
          },
          medium: {
            id: ts.medium_standard_subject.instruction_medium.id,
            name: ts.medium_standard_subject.instruction_medium.instruction_medium
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
              medium_standard_subject: {
                include: {
                  subject: true,
                  instruction_medium: true
                }
              }
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
          ts.medium_standard_subject.subject.name
        )).size
      };

      // Log what will be deleted
      this.logger.log(`Deleting user ${id} (${user.name}) will also delete:
        - ${relatedCounts.roles} role assignments
        - ${relatedCounts.schools} school associations
        - ${relatedCounts.teachingAssignments} teaching assignments
        - Teaching assignments for ${relatedCounts.uniqueSubjects} unique subjects
        
        Details:
        - Roles: ${user.user_roles.map(ur => ur.role.role_name).join(', ')}
        - Schools: ${user.user_schools.map(us => us.school.name).join(', ')}
        - Teaching: ${user.teacher_subjects.map(ts => 
          `${ts.medium_standard_subject.subject.name} at ${ts.school_standard.school.name}`
        ).join(', ')}
        
        All related records will be deleted.`);

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
      where: { email_id: email }
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findAllWithoutPagination(schoolId?: number, roleId?: number, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string, schoolSearch?: string) {
    try {
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
      // Validate email format
      if (!this.isValidEmail(addTeacherDto.email_id)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check for existing email
      const existingUser = await this.prisma.user.findUnique({
        where: { email_id: addTeacherDto.email_id }
      });

      if (existingUser) {
        throw new UserExistsException(addTeacherDto.email_id);
      }

      // Get the TEACHER role ID
      const teacherRole = await this.prisma.role.findFirst({
        where: { role_name: 'TEACHER' }
      });

      if (!teacherRole) {
        throw new NotFoundException('Teacher role not found');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(addTeacherDto.password);

      // Verify the school exists
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

      // Get available instruction mediums for the school
      const schoolMediumIds = school.school_instruction_mediums.map(medium => medium.instruction_medium_id);
      
      if (schoolMediumIds.length === 0) {
        throw new BadRequestException(`School with ID ${addTeacherDto.school_id} has no instruction mediums`);
      }

      // Validate school standards
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
        throw new BadRequestException(`Invalid school-standard IDs: ${invalidIds.join(', ')}`);
      }

      // Execute all operations in a transaction to ensure data consistency
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Create the user
        const user = await prisma.user.create({
          data: {
            name: toTitleCase(addTeacherDto.name),
            email_id: addTeacherDto.email_id,
            password: hashedPassword,
            contact_number: addTeacherDto.contact_number,
            alternate_contact_number: addTeacherDto.alternate_contact_number || null,
            highest_qualification: addTeacherDto.highest_qualification || null,
            status: addTeacherDto.status
          }
        });

        // 2. Assign the TEACHER role
        await prisma.user_Role.create({
          data: {
            user_id: user.id,
            role_id: teacherRole.id
          }
        });

        // 3. Assign the user to the school
        await prisma.user_School.create({
          data: {
            user_id: user.id,
            school_id: addTeacherDto.school_id,
            start_date: addTeacherDto.start_date,
            end_date: addTeacherDto.end_date || null
          }
        });

        // 4. Process each standard and its subjects
        const teacherSubjects = [];

        // For each standard-subject combination in the request
        for (const standardSubject of addTeacherDto.standard_subjects) {
          const { schoolStandardId, subjectIds } = standardSubject;

          // Get the standard information to use for finding medium_standard_subject entries
          const schoolStandard = validSchoolStandards.find(ss => ss.id === schoolStandardId);
          
          // For each subject, create teacher_subject entries for all available mediums
          for (const subjectId of subjectIds) {
            // Find valid medium_standard_subject combinations for this standard and subject
            // This checks if there are entries that match the school's mediums with the provided standard and subject
            const mediumStandardSubjects = await prisma.medium_Standard_Subject.findMany({
              where: {
                instruction_medium_id: { in: schoolMediumIds },
                standard_id: schoolStandard.standard_id,
                subject_id: subjectId
              }
            });

            // If no valid combinations found, log a warning and skip
            if (mediumStandardSubjects.length === 0) {
              this.logger.warn(
                `No valid medium-standard-subject found for standard ${schoolStandard.standard_id}, subject ${subjectId}`
              );
              continue;
            }

            // Add teacher_subject entries for each valid medium-standard-subject
            // This creates an entry for EACH medium available in the school for this standard-subject
            for (const mss of mediumStandardSubjects) {
              teacherSubjects.push({
                user_id: user.id,
                school_standard_id: schoolStandardId,
                medium_standard_subject_id: mss.id
              });
            }
          }
        }

        // Create all teacher_subject entries in a batch operation
        if (teacherSubjects.length > 0) {
          await prisma.teacher_Subject.createMany({
            data: teacherSubjects
          });
        } else {
          throw new BadRequestException('No valid medium-standard-subject combinations found for the provided standards and subjects');
        }

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
   * @param editTeacherDto - Data transfer object containing teacher update information
   * @returns The updated teacher with assignment details
   * @throws BadRequestException for validation errors
   * @throws NotFoundException if required entities are not found
   * @throws UserExistsException if email already exists
   * @throws InternalServerErrorException for other errors
   */
  async editTeacher(editTeacherDto: EditTeacherDto) {
    try {
      // Find the user to update and verify it exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: editTeacherDto.id },
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
        throw new NotFoundException(`User with ID ${editTeacherDto.id} not found`);
      }

      // Verify that the user is a teacher
      const isTeacher = existingUser.user_roles.some(ur => ur.role.role_name === 'TEACHER');
      if (!isTeacher) {
        throw new BadRequestException(`User with ID ${editTeacherDto.id} is not a teacher`);
      }

      // Validate email if it's being updated
      if (editTeacherDto.email_id && editTeacherDto.email_id !== existingUser.email_id) {
        if (!this.isValidEmail(editTeacherDto.email_id)) {
          throw new BadRequestException('Invalid email format');
        }

        // Check if email is already taken by another user
        const userWithEmail = await this.prisma.user.findUnique({
          where: { email_id: editTeacherDto.email_id }
        });

        if (userWithEmail && userWithEmail.id !== editTeacherDto.id) {
          throw new UserExistsException(editTeacherDto.email_id);
        }
      }

      // Prepare data for user update
      const updateData: Prisma.UserUpdateInput = {};
      
      // Add fields to update if they are provided
      if (editTeacherDto.name) {
        updateData.name = toTitleCase(editTeacherDto.name);
      }
      
      if (editTeacherDto.email_id) {
        updateData.email_id = editTeacherDto.email_id;
      }
      
      if (editTeacherDto.password) {
        updateData.password = await this.hashPassword(editTeacherDto.password);
      }
      
      if (editTeacherDto.contact_number) {
        updateData.contact_number = editTeacherDto.contact_number;
      }
      
      if (editTeacherDto.alternate_contact_number !== undefined) {
        updateData.alternate_contact_number = editTeacherDto.alternate_contact_number || null;
      }
      
      if (editTeacherDto.highest_qualification !== undefined) {
        updateData.highest_qualification = editTeacherDto.highest_qualification || null;
      }
      
      if (editTeacherDto.status !== undefined) {
        updateData.status = editTeacherDto.status;
      }

      // If school_id is provided, validate the school
      let school = null;
      let schoolMediumIds = [];
      
      if (editTeacherDto.school_id) {
        school = await this.prisma.school.findUnique({
          where: { id: editTeacherDto.school_id },
          include: {
            school_instruction_mediums: {
              include: {
                instruction_medium: true
              }
            }
          }
        });

        if (!school) {
          throw new NotFoundException(`School with ID ${editTeacherDto.school_id} not found`);
        }

        // Get available instruction mediums for the school
        schoolMediumIds = school.school_instruction_mediums.map(medium => medium.instruction_medium_id);
        
        if (schoolMediumIds.length === 0) {
          throw new BadRequestException(`School with ID ${editTeacherDto.school_id} has no instruction mediums`);
        }
      } else if (existingUser.user_schools.length > 0) {
        // Use existing school information if school_id is not provided
        const existingSchool = existingUser.user_schools[0].school;
        const existingSchoolWithMediums = await this.prisma.school.findUnique({
          where: { id: existingSchool.id },
          include: {
            school_instruction_mediums: {
              include: {
                instruction_medium: true
              }
            }
          }
        });
        
        school = existingSchoolWithMediums;
        schoolMediumIds = existingSchoolWithMediums.school_instruction_mediums.map(
          medium => medium.instruction_medium_id
        );
      }

      // Validate standard_subjects if provided
      let validSchoolStandards = [];
      
      if (editTeacherDto.standard_subjects) {
        if (!school) {
          throw new BadRequestException('Cannot update standard-subject assignments without a school');
        }

        const schoolStandardIds = editTeacherDto.standard_subjects.map(ss => ss.schoolStandardId);

        // Check if all provided school-standards exist and belong to the specified school
        validSchoolStandards = await this.prisma.school_Standard.findMany({
          where: {
            id: { in: schoolStandardIds },
            school_id: school.id
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
      }

      // Execute all operations in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Update the user
        const updatedUser = await prisma.user.update({
          where: { id: editTeacherDto.id },
          data: updateData
        });

        // 2. Update or create school assignment if school_id is provided
        if (editTeacherDto.school_id) {
          // Check if there's already a school assignment
          const existingSchoolAssignment = await prisma.user_School.findFirst({
            where: {
              user_id: updatedUser.id,
              school_id: editTeacherDto.school_id
            }
          });

          if (existingSchoolAssignment) {
            // Update existing assignment
            await prisma.user_School.update({
              where: { id: existingSchoolAssignment.id },
              data: {
                start_date: editTeacherDto.start_date || existingSchoolAssignment.start_date,
                end_date: editTeacherDto.end_date !== undefined 
                  ? editTeacherDto.end_date 
                  : existingSchoolAssignment.end_date
              }
            });
          } else {
            // Create new assignment
            await prisma.user_School.create({
              data: {
                user_id: updatedUser.id,
                school_id: editTeacherDto.school_id,
                start_date: editTeacherDto.start_date || new Date(),
                end_date: editTeacherDto.end_date || null
              }
            });
          }
        }

        // 3. Update standard-subject assignments if provided
        if (editTeacherDto.standard_subjects && editTeacherDto.standard_subjects.length > 0) {
          // Delete existing teacher_subject entries
          await prisma.teacher_Subject.deleteMany({
            where: { user_id: updatedUser.id }
          });

          // Create new teacher_subject entries
          const teacherSubjects = [];

          // For each standard-subject combination in the request
          for (const standardSubject of editTeacherDto.standard_subjects) {
            const { schoolStandardId, subjectIds } = standardSubject;

            // Get the standard information to use for finding medium_standard_subject entries
            const schoolStandard = validSchoolStandards.find(ss => ss.id === schoolStandardId);
            
            // For each subject, create teacher_subject entries for all available mediums
            for (const subjectId of subjectIds) {
              // Find valid medium_standard_subject combinations for this standard and subject
              const mediumStandardSubjects = await prisma.medium_Standard_Subject.findMany({
                where: {
                  instruction_medium_id: { in: schoolMediumIds },
                  standard_id: schoolStandard.standard_id,
                  subject_id: subjectId
                }
              });

              // If no valid combinations found, log a warning and skip
              if (mediumStandardSubjects.length === 0) {
                this.logger.warn(
                  `No valid medium-standard-subject found for standard ${schoolStandard.standard_id}, subject ${subjectId}`
                );
                continue;
              }

              // Add teacher_subject entries for each valid medium-standard-subject
              for (const mss of mediumStandardSubjects) {
                teacherSubjects.push({
                  user_id: updatedUser.id,
                  school_standard_id: schoolStandardId,
                  medium_standard_subject_id: mss.id
                });
              }
            }
          }

          // Create all teacher_subject entries in a batch operation
          if (teacherSubjects.length > 0) {
            await prisma.teacher_Subject.createMany({
              data: teacherSubjects
            });
          } else {
            throw new BadRequestException('No valid medium-standard-subject combinations found for the provided standards and subjects');
          }
        }

        // 4. Get updated teacher details
        // Get the latest school assignment
        const latestSchoolAssignment = await prisma.user_School.findFirst({
          where: { user_id: updatedUser.id },
          orderBy: { created_at: 'desc' },
          include: {
            school: true
          }
        });

        // Get current standard assignments
        const currentStandards = await prisma.teacher_Subject.findMany({
          where: { user_id: updatedUser.id },
          distinct: ['school_standard_id'],
          include: {
            school_standard: {
              include: {
                standard: true
              }
            }
          }
        });

        // Return the updated teacher details
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          email_id: updatedUser.email_id,
          contact_number: updatedUser.contact_number,
          alternate_contact_number: updatedUser.alternate_contact_number,
          highest_qualification: updatedUser.highest_qualification,
          status: updatedUser.status,
          role: 'TEACHER',
          school: latestSchoolAssignment?.school.name || 'Not Assigned',
          assigned_standards: currentStandards.map(ts => ts.school_standard.standard.name),
          message: 'Teacher updated successfully'
        };
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
} 