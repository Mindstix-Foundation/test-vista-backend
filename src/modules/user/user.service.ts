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
      where: { email_id: email },
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
} 