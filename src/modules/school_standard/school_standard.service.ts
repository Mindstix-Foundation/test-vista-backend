import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolStandardDto } from './dto/school-standard.dto';

@Injectable()
export class SchoolStandardService {
  private readonly logger = new Logger(SchoolStandardService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSchoolStandardDto) {
    try {
      // Check if school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${createDto.school_id} not found`);
      }

      // Check if standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: createDto.standard_id }
      });

      if (!standard) {
        throw new NotFoundException(`Standard with ID ${createDto.standard_id} not found`);
      }

      // Check if combination already exists
      const existing = await this.prisma.school_Standard.findFirst({
        where: {
          school_id: createDto.school_id,
          standard_id: createDto.standard_id
        }
      });

      if (existing) {
        throw new ConflictException('This standard is already assigned to the school');
      }

      return await this.prisma.school_Standard.create({
        data: createDto,
        include: {
          school: true,
          standard: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create school standard:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create school standard');
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
