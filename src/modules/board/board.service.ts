import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(private prisma: PrismaService) {}

  async create(createBoardDto: CreateBoardDto) {
    try {
      // Check if address exists
      const address = await this.prisma.address.findUnique({
        where: { id: createBoardDto.address_id }
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${createBoardDto.address_id} not found`);
      }

      // Check if address is already associated with a board
      const existingBoard = await this.prisma.board.findUnique({
        where: { address_id: createBoardDto.address_id }
      });

      if (existingBoard) {
        throw new ConflictException(`Address with ID ${createBoardDto.address_id} is already associated with a board`);
      }

      return await this.prisma.board.create({
        data: createBoardDto,
        include: {
          address: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create board:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Board with this name already exists');
        }
      }
      throw new InternalServerErrorException('Failed to create board');
    }
  }

  async findAll() {
    try {
      return await this.prisma.board.findMany({
        include: {
          address: true,
          standards: true,
          subjects: true,
          instruction_mediums: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch boards:', error);
      throw new InternalServerErrorException('Failed to fetch boards');
    }
  }

  async findOne(id: number) {
    try {
      const board = await this.prisma.board.findUnique({
        where: { id },
        include: {
          address: true,
          standards: true,
          subjects: true,
          instruction_mediums: true
        }
      });
      
      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }
      
      return board;
    } catch (error) {
      this.logger.error(`Failed to fetch board ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch board');
    }
  }

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    try {
      await this.findOne(id); // Check if board exists

      if (updateBoardDto.address_id) {
        // Check if new address exists
        const address = await this.prisma.address.findUnique({
          where: { id: updateBoardDto.address_id }
        });

        if (!address) {
          throw new NotFoundException(`Address with ID ${updateBoardDto.address_id} not found`);
        }

        // Check if address is already used by another board
        const existingBoard = await this.prisma.board.findFirst({
          where: {
            address_id: updateBoardDto.address_id,
            NOT: { id }
          }
        });

        if (existingBoard) {
          throw new ConflictException(`Address with ID ${updateBoardDto.address_id} is already associated with another board`);
        }
      }
      
      return await this.prisma.board.update({
        where: { id },
        data: updateBoardDto,
        include: {
          address: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update board ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Board with this name already exists');
        }
      }
      throw new InternalServerErrorException('Failed to update board');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const board = await this.findOne(id);

      // Check for related records
      const hasStandards = await this.prisma.standard.count({
        where: { board_id: id }
      });

      const hasSubjects = await this.prisma.subject.count({
        where: { board_id: id }
      });

      const hasInstructionMediums = await this.prisma.instruction_Medium.count({
        where: { board_id: id }
      });

      if (hasStandards || hasSubjects || hasInstructionMediums) {
        throw new BadRequestException(
          'Cannot delete board because it has associated standards, subjects, or instruction mediums. Please delete these first.'
        );
      }

      await this.prisma.board.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete board ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete board');
    }
  }
}
