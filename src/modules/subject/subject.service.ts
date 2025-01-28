import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { Prisma } from '@prisma/client';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSubjectDto) {
    try {
      // Check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id: createDto.board_id }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${createDto.board_id} not found`);
      }

      // Check for duplicate subject in the same board
      const existing = await this.prisma.subject.findFirst({
        where: { 
          name: toTitleCase(createDto.name) ,
          board_id: createDto.board_id 
        }
      });

      if (existing) {
        throw new ConflictException(`Subject '${createDto.name}' already exists for this board`);
      }

      return await this.prisma.subject.create({
        data: {
          name: toTitleCase(createDto.name),
          board_id: createDto.board_id,
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create subject:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create subject');
    }
  }

  async findAll() {
    try {
      return await this.prisma.subject.findMany({
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch subjects:', error);
      throw new InternalServerErrorException('Failed to fetch subjects');
    }
  }

  async findOne(id: number) {
    try {
      const subject = await this.prisma.subject.findUnique({
        where: { id },
        include: {
          board: true
        }
      });
      
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }
      
      return subject;
    } catch (error) {
      this.logger.error(`Failed to fetch subject ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch subject');
    }
  }

  async update(id: number, updateDto: UpdateSubjectDto) {
    try {
      await this.findOne(id);

      if (updateDto.board_id) {
        const board = await this.prisma.board.findUnique({
          where: { id: updateDto.board_id }
        });

        if (!board) {
          throw new NotFoundException(`Board with ID ${updateDto.board_id} not found`);
        }

        // Check for duplicate subject in the target board
        const existing = await this.prisma.subject.findFirst({
          where: { 
            name: updateDto.name || undefined,
            board_id: updateDto.board_id,
            NOT: { id }
          }
        });

        if (existing) {
          throw new ConflictException(`Subject already exists in the target board`);
        }
      }
      
      return await this.prisma.subject.update({
        where: { id },
        data: updateDto,
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update subject ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update subject');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.prisma.subject.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete subject ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete subject');
    }
  }

  async findByBoard(boardId: number) {
    return await this.prisma.subject.findMany({
      where: { board_id: boardId },
    });
  }
} 