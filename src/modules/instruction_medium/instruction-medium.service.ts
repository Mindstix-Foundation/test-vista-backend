import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstructionMediumDto, UpdateInstructionMediumDto } from './dto/instruction-medium.dto';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class InstructionMediumService {
  private readonly logger = new Logger(InstructionMediumService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateInstructionMediumDto) {
    try {
      // Check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id: createDto.board_id }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${createDto.board_id} not found`);
      }

      // Check for duplicate instruction medium in the same board
      const existing = await this.prisma.instruction_Medium.findFirst({
        where: { 
          instruction_medium: toTitleCase(createDto.name),
          board_id: createDto.board_id 
        }
      });

      if (existing) {
        throw new ConflictException(`Instruction medium '${createDto.name}' already exists for this board`);
      }

      return await this.prisma.instruction_Medium.create({
        data: {
          instruction_medium: toTitleCase(createDto.name),
          board_id: createDto.board_id
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create instruction medium:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create instruction medium');
    }
  }

  async findAll() {
    try {
      return await this.prisma.instruction_Medium.findMany({
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch instruction mediums:', error);
      throw new InternalServerErrorException('Failed to fetch instruction mediums');
    }
  }

  async findOne(id: number) {
    try {
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id },
        include: {
          board: true
        }
      });
      
      if (!instructionMedium) {
        throw new NotFoundException(`Instruction medium with ID ${id} not found`);
      }
      
      return instructionMedium;
    } catch (error) {
      this.logger.error(`Failed to fetch instruction medium ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch instruction medium');
    }
  }

  async update(id: number, updateDto: UpdateInstructionMediumDto) {
    try {
      // Get current instruction medium
      const currentInstructionMedium = await this.findOne(id);

      // If board_id is provided in update, check if it matches current board
      if (updateDto.board_id && updateDto.board_id !== currentInstructionMedium.board_id) {
        throw new BadRequestException('Cannot change the board of an instruction medium');
      }

      // Use current board_id if not provided in update
      const boardId = updateDto.board_id || currentInstructionMedium.board_id;

      // Check for duplicate instruction medium in the same board
      if (updateDto.name) {
        const existing = await this.prisma.instruction_Medium.findFirst({
          where: { 
            instruction_medium: toTitleCase(updateDto.name),
            board_id: boardId,
            NOT: { id }
          }
        });

        if (existing) {
          throw new ConflictException(`Instruction medium already exists in this board`);
        }
      }
      
      return await this.prisma.instruction_Medium.update({
        where: { id },
        data: {
          instruction_medium: updateDto.name ? toTitleCase(updateDto.name) : undefined,
          board_id: boardId
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update instruction medium ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException ||
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update instruction medium');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if instruction medium exists
      const instructionMedium = await this.findOne(id);

      // Check if it's being used in any school
      const schoolCount = await this.prisma.school_Instruction_Medium.count({
        where: { instruction_medium_id: id }
      });

      if (schoolCount > 0) {
        throw new BadRequestException('Cannot delete instruction medium as it is associated with schools');
      }

      // Check if it's being used in any medium_standard_subject
      const mssCount = await this.prisma.medium_Standard_Subject.count({
        where: { instruction_medium_id: id }
      });

      if (mssCount > 0) {
        throw new BadRequestException('Cannot delete instruction medium as it is associated with subjects');
      }

      await this.prisma.instruction_Medium.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete instruction medium ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete instruction medium');
    }
  }

  async findByBoard(boardId: number) {
    return await this.prisma.instruction_Medium.findMany({
      where: { board_id: boardId },
    });
  }
} 