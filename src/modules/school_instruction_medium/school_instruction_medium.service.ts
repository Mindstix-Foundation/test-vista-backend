import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolInstructionMediumDto } from './dto/school-instruction-medium.dto';

@Injectable()
export class SchoolInstructionMediumService {
  private readonly logger = new Logger(SchoolInstructionMediumService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSchoolInstructionMediumDto) {
    try {
      // Check if school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${createDto.school_id} not found`);
      }

      // Check if instruction medium exists
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id }
      });

      if (!instructionMedium) {
        throw new NotFoundException(`Instruction medium with ID ${createDto.instruction_medium_id} not found`);
      }

      // Check if combination already exists
      const existing = await this.prisma.school_Instruction_Medium.findFirst({
        where: {
          school_id: createDto.school_id,
          instruction_medium_id: createDto.instruction_medium_id
        }
      });

      if (existing) {
        throw new ConflictException('This instruction medium is already assigned to the school');
      }

      return await this.prisma.school_Instruction_Medium.create({
        data: createDto,
        include: {
          school: true,
          instruction_medium: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create school instruction medium:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create school instruction medium');
    }
  }

  async findAll() {
    try {
      return await this.prisma.school_Instruction_Medium.findMany({
        include: {
          school: true,
          instruction_medium: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch school instruction mediums:', error);
      throw new InternalServerErrorException('Failed to fetch school instruction mediums');
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

      return await this.prisma.school_Instruction_Medium.findMany({
        where: { school_id: schoolId },
        include: {
          instruction_medium: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to fetch instruction mediums for school ${schoolId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch school instruction mediums');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const schoolInstructionMedium = await this.prisma.school_Instruction_Medium.findUnique({
        where: { id }
      });

      if (!schoolInstructionMedium) {
        throw new NotFoundException(`School instruction medium with ID ${id} not found`);
      }

      await this.prisma.school_Instruction_Medium.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete school instruction medium ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete school instruction medium');
    }
  }
}
