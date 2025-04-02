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
          medium_standard_subjects: {
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
              medium_standard_subjects: true
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
          medium_standard_subjects: {
            some: hasSyllabus ? {} : undefined,
            none: !hasSyllabus ? {} : undefined,
          }
        };
      }

      const schoolStandards = await this.prisma.school_Standard.findMany({
        where,
        include: {
          standard: {
            select: {
              id: true,
              name: true,
              sequence_number: true,
              board_id: true
            }
          }
        }
      });

      // Sort standards by sequence number and transform to simpler response
      return schoolStandards
        .sort((a, b) => a.standard.sequence_number - b.standard.sequence_number)
        .map(ss => ({
          id: ss.id,
          school_id: ss.school_id,
          standard: {
            id: ss.standard.id,
            name: ss.standard.name,
            sequence_number: ss.standard.sequence_number,
            board_id: ss.standard.board_id
          }
        }));
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
      // Check if school standard exists with its relationships
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id },
        include: {
          school: true,
          standard: true,
          teacher_subjects: {
            include: {
              user: true,
              medium_standard_subject: true
            }
          }
        }
      });

      if (!schoolStandard) {
        throw new NotFoundException(`School standard with ID ${id} not found`);
      }

      // Get counts of related entities for informative message
      const relatedCounts = {
        teachers: new Set(schoolStandard.teacher_subjects.map(ts => ts.user_id)).size,
        subjects: new Set(schoolStandard.teacher_subjects.map(ts => ts.medium_standard_subject_id)).size
      };

      // Log what will be deleted
      this.logger.log(`Deleting school standard ${id} will also delete:
        - School: ${schoolStandard.school.name}
        - Standard: ${schoolStandard.standard.name}
        - ${relatedCounts.teachers} teacher assignments
        - ${relatedCounts.subjects} subject assignments
        and all their related records`);

      // Delete the school standard - cascade will handle all related records
      await this.prisma.school_Standard.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted school standard ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete school standard ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete school standard');
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