import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStandardDto, UpdateStandardDto } from './dto/standard.dto';

import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class StandardService {
  private readonly logger = new Logger(StandardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateStandardDto) {
    try {
      // Check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id: createDto.board_id }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${createDto.board_id} not found`);
      }

      // Check for duplicate standard in the same board
      const existing = await this.prisma.standard.findFirst({
        where: { 
          name:toTitleCase( createDto.name),
          board_id: createDto.board_id 
        }
      });

      if (existing) {
        throw new ConflictException(`Standard '${createDto.name}' already exists for this board`);
      }

      return await this.prisma.standard.create({
        data: {
          name: toTitleCase(createDto.name),
          board_id: createDto.board_id,
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create standard:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create standard');
    }
  }

  async findAll() {
    try {
      return await this.prisma.standard.findMany({
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch standards:', error);
      throw new InternalServerErrorException('Failed to fetch standards');
    }
  }

  async findOne(id: number) {
    try {
      const standard = await this.prisma.standard.findUnique({
        where: { id },
        include: {
          board: true
        }
      });
      
      if (!standard) {
        throw new NotFoundException(`Standard with ID ${id} not found`);
      }
      
      return standard;
    } catch (error) {
      this.logger.error(`Failed to fetch standard ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch standard');
    }
  }

  async update(id: number, updateDto: UpdateStandardDto) {
    try {
      await this.findOne(id);

      if (updateDto.board_id) {
        const board = await this.prisma.board.findUnique({
          where: { id: updateDto.board_id }
        });

        if (!board) {
          throw new NotFoundException(`Board with ID ${updateDto.board_id} not found`);
        }

        // Check for duplicate standard in the target board
        const existing = await this.prisma.standard.findFirst({
          where: { 
            name: updateDto.name || undefined,
            board_id: updateDto.board_id,
            NOT: { id }
          }
        });

        if (existing) {
          throw new ConflictException(`Standard already exists in the target board`);
        }
      }
      
      return await this.prisma.standard.update({
        where: { id },
        data: updateDto,
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update standard ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update standard');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.prisma.standard.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete standard ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete standard');
    }
  }

  async findByBoard(boardId: number) {
    return await this.prisma.standard.findMany({
      where: { board_id: boardId },
    });
  }
} 