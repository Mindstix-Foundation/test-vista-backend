import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolInstructionMediumDto } from './dto/school-instruction-medium.dto';

@Injectable()
export class SchoolInstructionMediumService {
  private readonly logger = new Logger(SchoolInstructionMediumService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSchoolInstructionMediumDto) {
    try {
      // Check if the school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id },
        include: { board: true } // Assuming you have a relation to Board
      });

      // Check if the instruction medium exists
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id },
        include: { board: true } // Assuming you have a relation to Board
      });

      if (!school || !instructionMedium) {
        throw new NotFoundException('School or Instruction Medium not found');
      }

      // Ensure both belong to the same board
      if (school.board_id !== instructionMedium.board_id) {
        throw new ConflictException('School and Instruction Medium must belong to the same board');
      }

      // Create the entry
      return await this.prisma.school_Instruction_Medium.create({
        data: {
          school_id: createDto.school_id,
          instruction_medium_id: createDto.instruction_medium_id,
        }
      });
    } catch (error) {
      this.logger.error('Failed to create School Instruction Medium:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error; // Rethrow known exceptions
      }
      throw new InternalServerErrorException('Failed to create School Instruction Medium');
    }
  }

  async findAll(instructionMediumId?: number) {
    try {
      return await this.prisma.school_Instruction_Medium.findMany({
        where: instructionMediumId ? { 
          instruction_medium_id: instructionMediumId 
        } : undefined,
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
