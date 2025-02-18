import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserSchoolDto, UpdateUserSchoolDto } from './dto/user-school.dto';


@Injectable()
export class UserSchoolService {
  private readonly logger = new Logger(UserSchoolService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly userSchoolSelect = {
    id: true,
    user: {
      select: {
        id: true,
        name: true,
        email_id: true
      }
    },
    school: {
      select: {
        id: true,
        name: true,
        board: {
          select: {
            name: true,
            abbreviation: true
          }
        }
      }
    },
    start_date: true,
    end_date: true,
    created_at: true
  };

  async create(createDto: CreateUserSchoolDto) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: createDto.user_id }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${createDto.user_id} not found`);
      }

      // Check if school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${createDto.school_id} not found`);
      }

      // Convert date strings to Date objects
      const startDate = new Date(createDto.start_date);
      const endDate = createDto.end_date ? new Date(createDto.end_date) : null;

      return await this.prisma.user_School.create({
        data: {
          user_id: createDto.user_id,
          school_id: createDto.school_id,
          start_date: startDate,
          end_date: endDate
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          school: {
            select: {
              id: true,
              name: true,
              board: {
                select: {
                  name: true,
                  abbreviation: true
                }
              }
            }
          },
          start_date: true,
          end_date: true,
          created_at: true
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new ConflictException('User is already assigned to this school');
      }
      throw new InternalServerErrorException('Failed to create user school assignment');
    }
  }

  async findAll() {
    try {
      return await this.prisma.user_School.findMany({
        select: this.userSchoolSelect
      });
    } catch (error) {
      this.logger.error('Failed to fetch user schools:', error);
      throw error;
    }
  }

  async findByUserId(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return await this.prisma.user_School.findMany({
        where: { 
          user_id: userId,
          end_date: null
        },
        select: this.userSchoolSelect
      });
    } catch (error) {
      this.logger.error(`Failed to fetch schools for user ${userId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user schools');
    }
  }

  async update(userId: number, schoolId: number, updateDto: UpdateUserSchoolDto) {
    try {
      const userSchool = await this.prisma.user_School.findFirst({
        where: {
          user_id: userId,
          school_id: schoolId
        }
      });

      if (!userSchool) {
        throw new NotFoundException('User school association not found');
      }

      return await this.prisma.user_School.update({
        where: { id: userSchool.id },
        data: updateDto,
        select: this.userSchoolSelect
      });
    } catch (error) {
      this.logger.error(`Failed to update user school:`, error);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if user school exists with its relationships
      const userSchool = await this.prisma.user_School.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              user_roles: {
                include: {
                  role: true
                }
              }
            }
          },
          school: true
        }
      });

      if (!userSchool) {
        throw new NotFoundException(`User school association with ID ${id} not found`);
      }

      // Get user roles for context
      const userRoles = userSchool.user.user_roles.map(ur => ur.role.role_name).join(', ');

      // Log what will be deleted
      this.logger.log(`Deleting user school assignment ${id}:
        - User: ${userSchool.user.name} (${userSchool.user.email_id})
        - School: ${userSchool.school.name}
        - User Roles: ${userRoles}
        - Assignment Period: ${userSchool.start_date.toISOString().split('T')[0]} to ${
          userSchool.end_date ? userSchool.end_date.toISOString().split('T')[0] : 'Present'
        }`);

      // Delete the user school - cascade will handle related records
      await this.prisma.user_School.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted user school assignment ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete user school assignment ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user school assignment');
    }
  }

  async findByUserAndSchool(userId: number, schoolId: number) {
    const userSchool = await this.prisma.user_School.findFirst({
      where: {
        user_id: userId,
        school_id: schoolId
      }
    });

    if (!userSchool) {
      throw new NotFoundException(`User school association not found for user ${userId} and school ${schoolId}`);
    }

    return userSchool;
  }
} 