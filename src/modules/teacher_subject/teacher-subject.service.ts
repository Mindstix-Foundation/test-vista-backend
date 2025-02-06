import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherSubjectDto } from './dto/teacher-subject.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeacherSubjectService {
  private readonly logger = new Logger(TeacherSubjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly teacherSubjectSelect = {
    id: true,
    user: {
      select: {
        id: true,
        name: true,
        email_id: true
      }
    },
    school_standard: {
      select: {
        id: true,
        school: {
          select: {
            id: true,
            name: true
          }
        },
        standard: {
          select: {
            id: true,
            name: true
          }
        }
      }
    },
    medium_standard_subject: {
      select: {
        id: true,
        instruction_medium: {
          select: {
            id: true,
            instruction_medium: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    },
    created_at: true,
    updated_at: true
  };

  async create(createDto: CreateTeacherSubjectDto) {
    try {
      // Check if teacher exists
      const teacher = await this.prisma.user.findUnique({
        where: { id: createDto.user_id }
      });
      if (!teacher) {
        throw new NotFoundException(`Teacher with ID ${createDto.user_id} not found`);
      }

      // Check if school standard exists
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id: createDto.school_standard_id }
      });
      if (!schoolStandard) {
        throw new NotFoundException(`School standard with ID ${createDto.school_standard_id} not found`);
      }

      // Check if medium standard subject exists
      const mss = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id: createDto.medium_standard_subject_id }
      });
      if (!mss) {
        throw new NotFoundException(`Medium standard subject with ID ${createDto.medium_standard_subject_id} not found`);
      }

      return await this.prisma.teacher_Subject.create({
        data: createDto,
        select: this.teacherSubjectSelect
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('This teacher subject assignment already exists');
        }
      }
      throw error;
    }
  }

  async findAll(filters?: { userId?: number; schoolStandardId?: number }) {
    try {
      return await this.prisma.teacher_Subject.findMany({
        where: {
          ...(filters?.userId && { user_id: filters.userId }),
          ...(filters?.schoolStandardId && { school_standard_id: filters.schoolStandardId })
        },
        select: this.teacherSubjectSelect
      });
    } catch (error) {
      this.logger.error('Failed to fetch teacher subjects:', error);
      throw new InternalServerErrorException('Failed to fetch teacher subjects');
    }
  }

  async findOne(id: number) {
    try {
      const teacherSubject = await this.prisma.teacher_Subject.findUnique({
        where: { id },
        select: this.teacherSubjectSelect
      });

      if (!teacherSubject) {
        throw new NotFoundException(`Teacher subject with ID ${id} not found`);
      }

      return teacherSubject;
    } catch (error) {
      this.logger.error(`Failed to fetch teacher subject ${id}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const teacherSubject = await this.prisma.teacher_Subject.findUnique({
        where: { id }
      });

      if (!teacherSubject) {
        throw new NotFoundException(`Teacher subject with ID ${id} not found`);
      }

      await this.prisma.teacher_Subject.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete teacher subject ${id}:`, error);
      throw error;
    }
  }
} 