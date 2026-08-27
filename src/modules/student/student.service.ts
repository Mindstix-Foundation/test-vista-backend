import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ConflictException, 
  InternalServerErrorException, 
  BadRequestException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { hash } from 'bcryptjs';
import { Prisma } from '../../prisma/client';
import { toTitleCase } from '../../utils/titleCase';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';
import { AuthService } from '../auth/auth.service';
import {
  generateOrgCode,
  InstitutionType,
  InstitutionVisibility,
  OrgMembershipStatus,
} from '../../common/utils/org-membership.util';
import { isWellFormedEmail } from '../../common/utils/email.util';

/**
 * Student search parameters for findAll method
 */
export class StudentSearchParams {
  schoolId?: number;
  standardId?: number;
  page?: number = 1;
  page_size?: number = 15;
  sort_by?: SortField = SortField.NAME;
  sort_order?: SortOrder = SortOrder.ASC;
  search?: string;
  status?: string;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {}

  async create(createDto: CreateStudentDto) {
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
        throw new ConflictException(`Email ${createDto.email_id} already exists`);
      }

      // Check for existing student ID in the same school-standard
      const existingStudent = await this.prisma.student.findFirst({
        where: {
          student_id: createDto.student_id,
          school_standard_id: createDto.school_standard_id
        }
      });

      if (existingStudent) {
        throw new ConflictException(`Student ID ${createDto.student_id} already exists in this school-standard`);
      }

      // Validate school-standard exists
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id: createDto.school_standard_id },
        include: {
          school: true,
          standard: true
        }
      });

      if (!schoolStandard) {
        throw new NotFoundException(`School Standard with ID ${createDto.school_standard_id} not found`);
      }

      let institution = await this.prisma.institution.findFirst({
        where: { school_id: schoolStandard.school_id },
      });
      if (!institution) {
        institution = await this.prisma.institution.create({
          data: {
            institution_type: InstitutionType.SCHOOL,
            name: schoolStandard.school.name,
            org_code: generateOrgCode('TV-S'),
            visibility: InstitutionVisibility.PRIVATE,
            school_id: schoolStandard.school_id,
            is_active: true,
          },
        });
      }
      if (!institution.is_active) {
        throw new BadRequestException(
          'This school/organization is closed and is not accepting new students.',
        );
      }

      const institutionId = institution.id;

      // Hash password
      const hashedPassword = await this.hashPassword(createDto.password);

      // Create user and student in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            email_id: createDto.email_id,
            password: hashedPassword,
            name: toTitleCase(createDto.name),
            contact_number: createDto.contact_number,
            alternate_contact_number: createDto.alternate_contact_number || null,
            status: true
          }
        });

        // Assign student role
        const studentRole = await prisma.role.findUnique({
          where: { role_name: 'STUDENT' }
        });

        if (!studentRole) {
          throw new NotFoundException('Student role not found');
        }

        await prisma.user_Role.create({
          data: {
            user_id: user.id,
            role_id: studentRole.id
          }
        });

        const studentStatus = createDto.status || 'pending';

        // Create student profile
        const student = await prisma.student.create({
          data: {
            user_id: user.id,
            student_id: createDto.student_id,
            date_of_birth: createDto.date_of_birth ? new Date(createDto.date_of_birth) : null,
            school_standard_id: createDto.school_standard_id,
            status: studentStatus
          }
        });

        const membership = await prisma.learner_Institution_Membership.create({
          data: {
            user_id: user.id,
            institution_id: institutionId,
            student_id: student.id,
            school_standard_id: createDto.school_standard_id,
            status:
              studentStatus === 'active'
                ? OrgMembershipStatus.active
                : OrgMembershipStatus.pending,
          },
        });

        return { user, student, membership };
      });

      return {
        id: result.student.id,
        user_id: result.user.id,
        email_id: result.user.email_id,
        name: result.user.name,
        contact_number: result.user.contact_number,
        alternate_contact_number: result.user.alternate_contact_number,
        student_id: result.student.student_id,
        date_of_birth: result.student.date_of_birth,
        school_standard_id: result.student.school_standard_id,
        status: result.student.status,
        membership_status: result.membership.status,
        enrollment_date: result.student.enrollment_date,
        created_at: result.student.created_at,
        updated_at: result.student.updated_at
      };
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof ConflictException ||
          error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to create student:', error);
      throw new InternalServerErrorException('Failed to create student');
    }
  }

  async findAll(params: StudentSearchParams) {
    try {
      const { 
        schoolId, 
        standardId, 
        page = 1, 
        page_size = 15, 
        sort_by = SortField.NAME, 
        sort_order = SortOrder.ASC, 
        search,
        status
      } = params;
      
      const skip = (page - 1) * page_size;
      
      // Build where clause
      let where: Prisma.StudentWhereInput = {};
      
      // Build school_standard filter
      let schoolStandardFilter: Prisma.School_StandardWhereInput = {};
      
      // Filter by school ID if provided
      if (schoolId) {
        schoolStandardFilter.school_id = schoolId;
      }
      
      // Filter by standard ID if provided
      if (standardId) {
        schoolStandardFilter.standard_id = standardId;
      }

      // Apply school_standard filter if any conditions exist
      if (Object.keys(schoolStandardFilter).length > 0) {
        where.school_standard = schoolStandardFilter;
      }

      // Filter by status if provided
      if (status) {
        where.status = status;
      }
      
      // Add search condition for student name or student ID
      if (search) {
        where.OR = [
          {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            student_id: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.student.count({ where });
      
      // Build orderBy object based on sort parameters
      let orderBy: Prisma.StudentOrderByWithRelationInput = {};
      if (sort_by === SortField.NAME) {
        orderBy = {
          user: {
            name: sort_order
          }
        };
      } else {
        orderBy[sort_by] = sort_order;
      }
      
      // Get paginated data with sorting
      const students = await this.prisma.student.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email_id: true,
              contact_number: true,
              alternate_contact_number: true,
              status: true
            }
          },
          school_standard: {
            include: {
              school: {
                select: {
                  name: true
                }
              },
              standard: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Transform the data to match the StudentListDto format
      const formattedStudents = students.map(student => ({
        id: student.id,
        name: student.user.name,
        student_id: student.student_id,
        email_id: student.user.email_id,
        school_name: student.school_standard.school.name,
        standard_name: student.school_standard.standard.name,
        status: student.status,
        enrollment_date: student.enrollment_date.toISOString()
      }));
      
      return {
        data: formattedStudents,
        meta: {
          total,
          page,
          page_size,
          total_pages: Math.ceil(total / page_size),
          sort_by,
          sort_order,
          search: search || undefined,
          status: status || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch students:', error);
      throw new InternalServerErrorException('Failed to fetch students');
    }
  }

  async findOne(id: number) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email_id: true,
              name: true,
              contact_number: true,
              alternate_contact_number: true,
              status: true,
              created_at: true,
              updated_at: true
            }
          },
          school_standard: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  board: {
                    select: {
                      id: true,
                      name: true,
                      abbreviation: true
                    }
                  }
                }
              },
              standard: {
                select: {
                  id: true,
                  name: true,
                  sequence_number: true
                }
              }
            }
          },
          test_assignments: {
            select: {
              id: true,
              test_paper: {
                select: {
                  id: true,
                  name: true
                }
              },
              assigned_date: true,
              due_date: true,
              status: true
            },
            orderBy: {
              assigned_date: 'desc'
            },
            take: 5 // Get recent 5 assignments
          },
          student_analytics: {
            select: {
              total_tests_taken: true,
              average_score: true,
              best_score: true,
              worst_score: true,
              last_score: true
            }
          }
        }
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      return {
        id: student.id,
        user_id: student.user.id,
        email_id: student.user.email_id,
        name: student.user.name,
        contact_number: student.user.contact_number,
        alternate_contact_number: student.user.alternate_contact_number,
        student_id: student.student_id,
        date_of_birth: student.date_of_birth,
        enrollment_date: student.enrollment_date,
        status: student.status,
        school_standard_id: student.school_standard_id,
        school: {
          id: student.school_standard.school.id,
          name: student.school_standard.school.name,
          board: student.school_standard.school.board
        },
        standard: {
          id: student.school_standard.standard.id,
          name: student.school_standard.standard.name,
          sequence_number: student.school_standard.standard.sequence_number
        },
        recent_assignments: student.test_assignments,
        analytics: student.student_analytics,
        created_at: student.created_at,
        updated_at: student.updated_at
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch student:', error);
      throw new InternalServerErrorException('Failed to fetch student');
    }
  }

  async update(id: number, updateDto: UpdateStudentDto) {
    try {
      const existingStudent = await this.prisma.student.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!existingStudent) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      await this.assertStudentUpdateConflicts(id, existingStudent, updateDto);

      await this.prisma.$transaction(async (prisma) => {
        await this.applyStudentUserUpdates(prisma, existingStudent.user_id, id, updateDto);
        return true;
      });

      return await this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof ConflictException ||
          error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to update student:', error);
      throw new InternalServerErrorException('Failed to update student');
    }
  }

  private async assertStudentUpdateConflicts(
    id: number,
    existingStudent: { student_id: string; school_standard_id: number; user: { email_id: string } },
    updateDto: UpdateStudentDto,
  ): Promise<void> {
    if (updateDto.email_id && updateDto.email_id !== existingStudent.user.email_id) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email_id: updateDto.email_id }
      });
      if (emailExists) {
        throw new ConflictException(`Email ${updateDto.email_id} already exists`);
      }
    }

    if (updateDto.student_id && updateDto.student_id !== existingStudent.student_id) {
      const studentIdExists = await this.prisma.student.findFirst({
        where: {
          student_id: updateDto.student_id,
          school_standard_id: updateDto.school_standard_id || existingStudent.school_standard_id,
          id: { not: id }
        }
      });
      if (studentIdExists) {
        throw new ConflictException(`Student ID ${updateDto.student_id} already exists in this school-standard`);
      }
    }

    if (updateDto.school_standard_id && updateDto.school_standard_id !== existingStudent.school_standard_id) {
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id: updateDto.school_standard_id }
      });
      if (!schoolStandard) {
        throw new NotFoundException(`School Standard with ID ${updateDto.school_standard_id} not found`);
      }
    }
  }

  private async applyStudentUserUpdates(
    prisma: Prisma.TransactionClient,
    userId: number,
    studentId: number,
    updateDto: UpdateStudentDto,
  ): Promise<void> {
    const userUpdateData = this.buildStudentUserUpdateData(updateDto);
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    const studentUpdateData = this.buildStudentRecordUpdateData(updateDto);
    if (Object.keys(studentUpdateData).length > 0) {
      await prisma.student.update({
        where: { id: studentId },
        data: studentUpdateData
      });
    }
  }

  private buildStudentUserUpdateData(updateDto: UpdateStudentDto): Prisma.UserUpdateInput {
    const userUpdateData: Prisma.UserUpdateInput = {};
    if (updateDto.email_id) userUpdateData.email_id = updateDto.email_id;
    if (updateDto.name) userUpdateData.name = toTitleCase(updateDto.name);
    if (updateDto.contact_number) userUpdateData.contact_number = updateDto.contact_number;
    if (updateDto.alternate_contact_number !== undefined) {
      userUpdateData.alternate_contact_number = updateDto.alternate_contact_number || null;
    }
    return userUpdateData;
  }

  private buildStudentRecordUpdateData(updateDto: UpdateStudentDto): Prisma.StudentUpdateInput {
    const studentUpdateData: Prisma.StudentUpdateInput = {};
    if (updateDto.student_id) studentUpdateData.student_id = updateDto.student_id;
    if (updateDto.date_of_birth !== undefined) {
      studentUpdateData.date_of_birth = updateDto.date_of_birth ? new Date(updateDto.date_of_birth) : null;
    }
    if (updateDto.school_standard_id) {
      studentUpdateData.school_standard = {
        connect: { id: updateDto.school_standard_id }
      };
    }
    if (updateDto.status) studentUpdateData.status = updateDto.status;
    return studentUpdateData;
  }

  async remove(id: number): Promise<void> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      const userId = student.user_id;

      // Delete student and user in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Delete student (this will cascade delete related records)
        await prisma.student.delete({
          where: { id }
        });

        // Delete user (this will cascade delete user_roles and other related records)
        await prisma.user.delete({
          where: { id: userId }
        });
      });

      // After successful deletion, invalidate all tokens for this user
      // This will log out the student from all devices if they're currently logged in
      try {
        await this.authService.invalidateAllUserTokens(userId);
        this.logger.log(`Successfully invalidated all tokens for deleted student user ID: ${userId}`);
      } catch (authError) {
        // Log the error but don't fail the deletion
        this.logger.warn(`Failed to invalidate tokens for deleted student user ID: ${userId}`, authError);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to delete student:', error);
      throw new InternalServerErrorException('Failed to delete student');
    }
  }

  async findAllWithoutPagination(params: StudentSearchParams) {
    try {
      const { 
        schoolId, 
        standardId, 
        sort_by = SortField.NAME, 
        sort_order = SortOrder.ASC, 
        search,
        status
      } = params;
      
      // Build where clause
      let where: Prisma.StudentWhereInput = {};
      
      // Build school_standard filter
      let schoolStandardFilter: Prisma.School_StandardWhereInput = {};
      
      // Filter by school ID if provided
      if (schoolId) {
        schoolStandardFilter.school_id = schoolId;
      }
      
      // Filter by standard ID if provided
      if (standardId) {
        schoolStandardFilter.standard_id = standardId;
      }

      // Apply school_standard filter if any conditions exist
      if (Object.keys(schoolStandardFilter).length > 0) {
        where.school_standard = schoolStandardFilter;
      }

      // Filter by status if provided
      if (status) {
        where.status = status;
      }
      
      // Add search condition for student name or student ID
      if (search) {
        where.OR = [
          {
            user: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            student_id: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }
      
      // Build orderBy object based on sort parameters
      let orderBy: Prisma.StudentOrderByWithRelationInput = {};
      if (sort_by === SortField.NAME) {
        orderBy = {
          user: {
            name: sort_order
          }
        };
      } else {
        orderBy[sort_by] = sort_order;
      }
      
      // Get all data with sorting
      const students = await this.prisma.student.findMany({
        where,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email_id: true,
              contact_number: true,
              alternate_contact_number: true,
              status: true
            }
          },
          school_standard: {
            include: {
              school: {
                select: {
                  name: true
                }
              },
              standard: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Transform the data to match the StudentListDto format
      const formattedStudents = students.map(student => ({
        id: student.id,
        name: student.user.name,
        student_id: student.student_id,
        email_id: student.user.email_id,
        school_name: student.school_standard.school.name,
        standard_name: student.school_standard.standard.name,
        status: student.status,
        enrollment_date: student.enrollment_date.toISOString()
      }));
      
      return {
        data: formattedStudents,
        meta: {
          total: formattedStudents.length,
          sort_by,
          sort_order,
          search: search || undefined,
          status: status || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch students without pagination:', error);
      throw new InternalServerErrorException('Failed to fetch students');
    }
  }

  async checkStudentIdAvailability(studentId: string, schoolStandardId: number) {
    try {
      const existingStudent = await this.prisma.student.findFirst({
        where: {
          student_id: studentId,
          school_standard_id: schoolStandardId
        }
      });

      return {
        student_id: studentId,
        school_standard_id: schoolStandardId,
        available: !existingStudent,
        message: existingStudent ? 'Student ID is already taken in this school-standard' : 'Student ID is available'
      };
    } catch (error) {
      this.logger.error('Failed to check student ID availability:', error);
      throw new InternalServerErrorException('Failed to check student ID availability');
    }
  }

  private isValidEmail(email: string): boolean {
    return isWellFormedEmail(email);
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await hash(password, 12);
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw new InternalServerErrorException('Failed to process password');
    }
  }
} 