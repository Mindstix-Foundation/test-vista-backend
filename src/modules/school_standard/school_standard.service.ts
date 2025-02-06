import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolStandardDto } from './dto/school-standard.dto';

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

  async findAll() {
    try {
      return await this.prisma.school_Standard.findMany({
        include: {
          school: true,
          standard: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch school standards:', error);
      throw new InternalServerErrorException('Failed to fetch school standards');
    }
  }

  async findBySchool(schoolId: number) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${schoolId} not found`);
      }

      return await this.prisma.school_Standard.findMany({
        where: { school_id: schoolId },
        include: {
          standard: true
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
      const schoolStandard = await this.prisma.school_Standard.findUnique({
        where: { id }
      });

      if (!schoolStandard) {
        throw new NotFoundException(`School standard with ID ${id} not found`);
      }

      await this.prisma.school_Standard.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete school standard ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete school standard');
    }
  }
}
