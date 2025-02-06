import { Injectable, Logger, NotFoundException,  ConflictException, InternalServerErrorException } from '@nestjs/common';
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
          instruction_medium:toTitleCase( createDto.name),
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
      await this.findOne(id);

      if (updateDto.board_id) {
        const board = await this.prisma.board.findUnique({
          where: { id: updateDto.board_id }
        });

        if (!board) {
          throw new NotFoundException(`Board with ID ${updateDto.board_id} not found`);
        }

        // Check for duplicate instruction medium in the target board
        const existing = await this.prisma.instruction_Medium.findFirst({
          where: { 
            instruction_medium: updateDto.name || undefined,
            board_id: updateDto.board_id,
            NOT: { id }
          }
        });

        if (existing) {
          throw new ConflictException(`Instruction medium already exists in the target board`);
        }
      }
      
      return await this.prisma.instruction_Medium.update({
        where: { id },
        data: {
          instruction_medium: updateDto.name,
          board_id: updateDto.board_id
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update instruction medium ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update instruction medium');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.prisma.instruction_Medium.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete instruction medium ${id}:`, error);
      if (error instanceof NotFoundException) {
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