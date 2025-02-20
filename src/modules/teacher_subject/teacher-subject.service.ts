import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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

      // Get medium standard subject details
      const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id: createDto.medium_standard_subject_id },
        include: {
          standard: true,
          instruction_medium: true,
          subject: true
        }
      });

      if (!mediumStandardSubject) {
        throw new NotFoundException(
          `Medium standard subject with ID ${createDto.medium_standard_subject_id} not found`
        );
      }

      // Check if standards match
      if (schoolStandard.standard_id !== mediumStandardSubject.standard_id) {
        throw new BadRequestException(
          `Standards do not match. School Standard: ${schoolStandard.standard.name}, ` +
          `Medium Standard Subject Standard: ${mediumStandardSubject.standard.name}`
        );
      }

      // Check for existing assignment
      const existing = await this.prisma.teacher_Subject.findFirst({
        where: {
          user_id: createDto.user_id,
          school_standard_id: createDto.school_standard_id,
          medium_standard_subject_id: createDto.medium_standard_subject_id
        }
      });

      if (existing) {
        throw new ConflictException('This teacher subject assignment already exists');
      }

      return await this.prisma.teacher_Subject.create({
        data: createDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          school_standard: {
            include: {
              school: true,
              standard: true
            }
          },
          medium_standard_subject: {
            include: {
              instruction_medium: true,
              standard: true,
              subject: true
            }
          }
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
          medium_standard_subject: {
            include: {
              instruction_medium: true,
              subject: true
            }
          }
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
        - Subject: ${teacherSubject.medium_standard_subject.subject.name}
        - Medium: ${teacherSubject.medium_standard_subject.instruction_medium.instruction_medium}`);

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
          medium_standard_subject: {
            include: {
              instruction_medium: true,
              subject: true
            }
          }
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
          - Subject: ${assignment.medium_standard_subject.subject.name}
          - Medium: ${assignment.medium_standard_subject.instruction_medium.instruction_medium}
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