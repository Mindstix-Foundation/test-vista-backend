import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMediumStandardSubjectDto, GetMssQueryDto } from './dto/medium-standard-subject.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MediumStandardSubjectService {
  private readonly logger = new Logger(MediumStandardSubjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly mssSelect = {
    id: true,
    instruction_medium_id: true,
    standard_id: true,
    subject_id: true,
    instruction_medium: {
      select: {
        id: true,
        instruction_medium: true,
        board: {
          select: {
            name: true,
            abbreviation: true
          }
        }
      }
    },
    standard: {
      select: {
        id: true,
        name: true
      }
    },
    subject: {
      select: {
        id: true,
        name: true
      }
    },
    created_at: true,
    updated_at: true
  };

  async create(createDto: CreateMediumStandardSubjectDto) {
    try {
      // Get instruction medium with its board
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id },
        include: { board: true }
      });

      if (!instructionMedium) {
        throw new NotFoundException(`Instruction medium with ID ${createDto.instruction_medium_id} not found`);
      }

      // Get standard with its board
      const standard = await this.prisma.standard.findUnique({
        where: { id: createDto.standard_id },
        include: { board: true }
      });

      if (!standard) {
        throw new NotFoundException(`Standard with ID ${createDto.standard_id} not found`);
      }

      // Get subject with its board
      const subject = await this.prisma.subject.findUnique({
        where: { id: createDto.subject_id },
        include: { board: true }
      });

      if (!subject) {
        throw new NotFoundException(`Subject with ID ${createDto.subject_id} not found`);
      }

      // Check if all components belong to the same board
      if (instructionMedium.board_id !== standard.board_id || 
          standard.board_id !== subject.board_id) {
        throw new BadRequestException(
          'Invalid combination: Instruction medium, standard, and subject must belong to the same board. ' +
          `Instruction Medium Board: ${instructionMedium.board.name}, ` +
          `Standard Board: ${standard.board.name}, ` +
          `Subject Board: ${subject.board.name}`
        );
      }

      // Check for existing combination
      const existing = await this.prisma.medium_Standard_Subject.findFirst({
        where: {
          instruction_medium_id: createDto.instruction_medium_id,
          standard_id: createDto.standard_id,
          subject_id: createDto.subject_id
        }
      });

      if (existing) {
        throw new ConflictException('This combination already exists');
      }

      return await this.prisma.medium_Standard_Subject.create({
        data: createDto,
        include: {
          instruction_medium: {
            include: {
              board: true
            }
          },
          standard: true,
          subject: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create medium standard subject:', error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create medium standard subject');
    }
  }

  async findAll(query: GetMssQueryDto) {
    try {
      const { board_id, instruction_medium_id, standard_id, subject_id } = query;
      
      const where: any = {};

      // If board_id is provided, filter all related entities by board
      if (board_id) {
        where.OR = [
          {
            instruction_medium: {
              board_id: board_id
            }
          },
          {
            standard: {
              board_id: board_id
            }
          },
          {
            subject: {
              board_id: board_id
            }
          }
        ];
      }

      // Add other filters
      if (instruction_medium_id) {
        where.instruction_medium_id = instruction_medium_id;
      }
      if (standard_id) {
        where.standard_id = standard_id;
      }
      if (subject_id) {
        where.subject_id = subject_id;
      }

      return await this.prisma.medium_Standard_Subject.findMany({
        where,
        select: this.mssSelect
      });
    } catch (error) {
      this.logger.error('Failed to fetch medium standard subjects:', error);
      throw new InternalServerErrorException('Failed to fetch medium standard subjects');
    }
  }

  async findByMediumAndStandard(mediumId: number, standardId: number, boardId?: number) {
    try {
      // Check if instruction medium exists and belongs to the board if specified
      const medium = await this.prisma.instruction_Medium.findFirst({
        where: { 
          id: mediumId,
          ...(boardId && { board_id: boardId })
        }
      });
      
      if (!medium) {
        throw new NotFoundException(
          boardId 
            ? `Instruction medium with ID ${mediumId} not found in board ${boardId}`
            : `Instruction medium with ID ${mediumId} not found`
        );
      }

      // Check if standard exists and belongs to the board if specified
      const standard = await this.prisma.standard.findFirst({
        where: { 
          id: standardId,
          ...(boardId && { board_id: boardId })
        }
      });
      
      if (!standard) {
        throw new NotFoundException(
          boardId 
            ? `Standard with ID ${standardId} not found in board ${boardId}`
            : `Standard with ID ${standardId} not found`
        );
      }

      const where: any = {
        instruction_medium_id: mediumId,
        standard_id: standardId
      };

      // Add board filter if provided
      if (boardId) {
        where.instruction_medium = {
          board_id: boardId
        };
      }

      return await this.prisma.medium_Standard_Subject.findMany({
        where,
        select: this.mssSelect
      });
    } catch (error) {
      this.logger.error(`Failed to fetch subjects for medium ${mediumId} and standard ${standardId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch medium standard subjects');
    }
  }

  async remove(id: number) {
    try {
      const mss = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id }
      });

      if (!mss) {
        throw new NotFoundException(`Medium standard subject with ID ${id} not found`);
      }

      // Check for related teacher subjects
      const hasTeacherSubjects = await this.prisma.teacher_Subject.count({
        where: { medium_standard_subject_id: id }
      });

      if (hasTeacherSubjects) {
        throw new ConflictException('Cannot delete as there are teachers assigned to this subject');
      }

      await this.prisma.medium_Standard_Subject.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete medium standard subject ${id}:`, error);
      throw error;
    }
  }
} 