import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherSubjectDto } from './dto/teacher-subject.dto';
import { Prisma } from '@prisma/client';
import { parseQueryParams } from '../../utils/queryParams';

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
    subject: {
      select: {
        id: true,
        name: true,
        board: {
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
      // Check if user exists and is associated with the school
      const userSchool = await this.prisma.user_School.findFirst({
        where: {
          user_id: createDto.user_id,
          school_id: {
            equals: (
              await this.prisma.school_Standard.findUnique({
                where: { id: createDto.school_standard_id },
                select: { school_id: true }
              })
            )?.school_id
          }
        },
        include: {
          school: true
        }
      });

      if (!userSchool) {
        throw new BadRequestException('Teacher is not associated with this school');
      }

      // Get school standard details
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id: createDto.school_standard_id },
        include: {
          standard: true,
          school: true
        }
      });

      if (!schoolStandard) {
        throw new NotFoundException(`School standard with ID ${createDto.school_standard_id} not found`);
      }

      // Get subject details
      const subject = await this.prisma.subject.findUnique({
        where: { id: createDto.subject_id }
      });

      if (!subject) {
        throw new NotFoundException(
          `Subject with ID ${createDto.subject_id} not found`
        );
      }

      // Check for existing assignment
      const existing = await this.prisma.teacher_Subject.findFirst({
        where: {
          user_id: createDto.user_id,
          school_standard_id: createDto.school_standard_id,
          subject_id: createDto.subject_id
        }
      });

      if (existing) {
        throw new ConflictException('This teacher subject assignment already exists');
      }

      return await this.prisma.teacher_Subject.create({
        data: createDto,
        include: {
          user: true,
          school_standard: {
            include: {
              school: true,
              standard: true
            }
          },
          subject: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create teacher subject:', error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create teacher subject');
    }
  }

  async findAll(filters: { userId?: string; schoolStandardId?: string }) {
    try {
      const parsedParams = parseQueryParams(
        { 
          userId: filters.userId, 
          schoolStandardId: filters.schoolStandardId 
        },
        ['userId', 'schoolStandardId']
      );

      const where: any = {};

      if (parsedParams.userId) {
        where.user_id = parsedParams.userId;
      }

      if (parsedParams.schoolStandardId) {
        where.school_standard_id = parsedParams.schoolStandardId;
      }

      return await this.prisma.teacher_Subject.findMany({
        where,
        select: this.teacherSubjectSelect
      });
    } catch (error) {
      this.logger.error('Failed to fetch teacher subjects:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
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

  async remove(id: number): Promise<void> {
    try {
      // Check if teacher subject exists with its relationships
      const teacherSubject = await this.prisma.teacher_Subject.findUnique({
        where: { id },
        include: {
          user: true,
          school_standard: {
            include: {
              school: true,
              standard: true
            }
          },
          subject: true
        }
      });

      if (!teacherSubject) {
        throw new NotFoundException(`Teacher subject with ID ${id} not found`);
      }

      // Log what will be deleted
      this.logger.log(`Deleting teacher subject assignment ${id}:
        - Teacher: ${teacherSubject.user.name}
        - School: ${teacherSubject.school_standard.school.name}
        - Standard: ${teacherSubject.school_standard.standard.name}
        - Subject: ${teacherSubject.subject.name}`);

      // Delete the teacher subject - cascade will handle related records
      await this.prisma.teacher_Subject.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted teacher subject assignment ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete teacher subject assignment ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete teacher subject assignment');
    }
  }

  async removeByUserId(userId: number): Promise<void> {
    try {
      // Check if user exists and has any assignments
      const assignments = await this.prisma.teacher_Subject.findMany({
        where: { user_id: userId },
        include: {
          user: true,
          school_standard: {
            include: {
              school: true,
              standard: true
            }
          },
          subject: true
        }
      });

      if (!assignments.length) {
        throw new NotFoundException(`No teacher subject assignments found for user ID ${userId}`);
      }

      // Log what will be deleted
      this.logger.log(`Deleting all teacher subject assignments for user ${assignments[0].user.name}:`);
      assignments.forEach(assignment => {
        this.logger.log(`
          - School: ${assignment.school_standard.school.name}
          - Standard: ${assignment.school_standard.standard.name}
          - Subject: ${assignment.subject.name}
        `);
      });

      // Delete all assignments for the user
      await this.prisma.teacher_Subject.deleteMany({
        where: { user_id: userId }
      });

      this.logger.log(`Successfully deleted ${assignments.length} teacher subject assignments for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete teacher subject assignments for user ${userId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete teacher subject assignments');
    }
  }
} 