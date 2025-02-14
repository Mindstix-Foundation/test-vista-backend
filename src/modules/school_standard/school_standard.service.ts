import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolStandardDto } from './dto/school-standard.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolStandardService {
  private readonly logger = new Logger(SchoolStandardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSchoolStandardDto) {
    try {
      // Check if the school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id },
        include: { board: true } // Assuming you have a relation to Board
      });

      // Check if the standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: createDto.standard_id },
        include: { board: true } // Assuming you have a relation to Board
      });

      if (!school || !standard) {
        throw new NotFoundException('School or Standard not found');
      }

      // Ensure both belong to the same board
      if (school.board_id !== standard.board_id) {
        throw new ConflictException('School and Standard must belong to the same board');
      }

      // Create the entry
      return await this.prisma.school_Standard.create({
        data: {
          school_id: createDto.school_id,
          standard_id: createDto.standard_id,
        }
      });
    } catch (error) {
      this.logger.error('Failed to create School Standard:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error; // Rethrow known exceptions
      }
      throw new InternalServerErrorException('Failed to create School Standard');
    }
  }

  async findAll(standardId?: number, hasSyllabus?: boolean) {
    try {
      const where: any = {};
      
      // Add standard ID filter if provided
      if (standardId) {
        where.standard_id = standardId;
      }

      // Add syllabus filter if requested
      if (hasSyllabus !== undefined) {
        where.standard = {
          Medium_Standard_Subject: {
            some: hasSyllabus ? {} : undefined,
            none: !hasSyllabus ? {} : undefined,
          }
        };
      }

      return await this.prisma.school_Standard.findMany({
        where,
        include: {
          school: true,
          standard: {
            include: {
              Medium_Standard_Subject: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch school standards:', error);
      throw new InternalServerErrorException('Failed to fetch school standards');
    }
  }

  async findBySchool(schoolId: number, hasSyllabus?: boolean) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${schoolId} not found`);
      }

      const where: any = { school_id: schoolId };

      // Add syllabus filter if requested
      if (hasSyllabus !== undefined) {
        where.standard = {
          Medium_Standard_Subject: {
            some: hasSyllabus ? {} : undefined,
            none: !hasSyllabus ? {} : undefined,
          }
        };
      }

      return await this.prisma.school_Standard.findMany({
        where,
        include: {
          standard: {
            include: {
              Medium_Standard_Subject: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Failed to fetch standards for school ${schoolId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch school standards');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if the school standard exists
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id }
      });

      if (!schoolStandard) {
        throw new NotFoundException(`School standard with ID ${id} not found`);
      }

      // Get all teacher records for this standard
      const teachers = await this.prisma.teacher_Subject.findMany({
        where: {
          school_standard_id: id
        },
        select: {
          user_id: true
        }
      });

      // Count unique teachers using Set
      const uniqueTeachers = new Set(teachers.map(t => t.user_id));
      const teacherCount = uniqueTeachers.size;

      // Construct messages based on counts
      if (teacherCount > 0) {
        throw new ConflictException(`Cannot remove standard as it is associated with ${teacherCount} teacher${teacherCount > 1 ? 's' : ''}.`);
      }

      // Proceed to delete the school_Standard
      await this.prisma.school_Standard.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete school standard ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete standard');
    }
  }

  async findOne(id: number) {
    const standard = await this.prisma.standard.findUnique({
      where: { id },
      include: {
        board: true
      },
    });

    if (!standard) {
      throw new NotFoundException(`Standard with ID ${id} not found`);
    }

    return standard;
  }
}