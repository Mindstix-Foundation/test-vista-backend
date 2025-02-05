import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserRoleDto } from './dto/user-role.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateUserRoleDto) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: createDto.user_id }
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${createDto.user_id} not found`);
      }

      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: createDto.role_id }
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${createDto.role_id} not found`);
      }

      return await this.prisma.user_Role.create({
        data: createDto,
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          role: {
            select: {
              id: true,
              role_name: true
            }
          },
          created_at: true
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User already has this role');
        }
      }
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.user_Role.findMany({
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          role: {
            select: {
              id: true,
              role_name: true
            }
          },
          created_at: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch user roles:', error);
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

      return await this.prisma.user_Role.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          role: {
            select: {
              id: true,
              role_name: true
            }
          },
          created_at: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to fetch roles for user ${userId}:`, error);
      throw error;
    }
  }

  async remove(userId: number, roleId: number) {
    try {
      const userRole = await this.prisma.user_Role.findFirst({
        where: {
          user_id: userId,
          role_id: roleId
        }
      });

      if (!userRole) {
        throw new NotFoundException(`User role association not found`);
      }

      await this.prisma.user_Role.delete({
        where: { id: userRole.id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete user role:`, error);
      throw error;
    }
  }
} 