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
      // Check if the school instruction medium exists
      const schoolInstructionMedium = await this.prisma.school_Instruction_Medium.findUnique({
        where: { id },
        include: {
          instruction_medium: true,
          school: true
        }
      });

      if (!schoolInstructionMedium) {
        throw new NotFoundException(`School instruction medium with ID ${id} not found`);
      }

      const messages: string[] = []; // Array to collect messages

      // Find the instruction medium ID
      const instructionMediumId = schoolInstructionMedium.instruction_medium_id;

      // Find all related medium standard subjects
      const mediumStandardSubjects = await this.prisma.medium_Standard_Subject.findMany({
        where: { instruction_medium_id: instructionMediumId }
      });
      
      // Get unique teacher IDs associated with the medium standard subjects
      const teacherIds = new Set<number>(); // Use a Set to avoid duplicates

      for (const subject of mediumStandardSubjects) {
        const teachers = await this.prisma.teacher_Subject.findMany({
          where: { medium_standard_subject_id: subject.id },
          include: {
            school_standard: true
          }
        });

        teachers.forEach(teacher => {
          // Check if the teacher's school matches the school of the instruction medium
          if (teacher.school_standard.school_id === schoolInstructionMedium.school_id) {
            teacherIds.add(teacher.user_id); // Add unique teacher ID
          }
        });
      }

      // Count unique teachers
      const teacherCount = teacherIds.size;

      // Construct messages based on counts
      if (teacherCount > 0) {
        messages.push(`Cannot remove instruction medium as it is associated with ${teacherCount} teacher${teacherCount > 1 ? 's' : ''}.`);
      }

      // If there are any messages, throw a combined exception
      if (messages.length > 0) {
        throw new ConflictException(messages.join(' '));
      }

      // Proceed to delete the school instruction medium
      await this.prisma.school_Instruction_Medium.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete school instruction medium ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error; // Rethrow known exceptions
      }
      throw new InternalServerErrorException('Failed to delete school instruction medium');
    }
  }
}
