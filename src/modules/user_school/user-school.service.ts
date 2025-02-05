import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserSchoolDto, UpdateUserSchoolDto } from './dto/user-school.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserSchoolService {
  private readonly logger = new Logger(UserSchoolService.name);

  constructor(private prisma: PrismaService) {}

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

      return await this.prisma.user_School.create({
        data: createDto,
        select: this.userSchoolSelect
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User is already associated with this school');
        }
      }
      throw error;
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
        where: { user_id: userId },
        select: this.userSchoolSelect
      });
    } catch (error) {
      this.logger.error(`Failed to fetch schools for user ${userId}:`, error);
      throw error;
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

  async remove(userId: number, schoolId: number) {
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

      await this.prisma.user_School.delete({
        where: { id: userSchool.id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete user school:`, error);
      throw error;
    }
  }
} 