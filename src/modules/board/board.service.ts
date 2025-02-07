import { Injectable, Logger, NotFoundException,  ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { Prisma } from '@prisma/client';
import { toTitleCase } from '../../utils/titleCase';


@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateBoardDto) {
    try {
      // Check if address exists
      const address = await this.prisma.address.findUnique({
        where: { id: createDto.address_id }
      });
      if (!address) {
        throw new NotFoundException(`Address with ID ${createDto.address_id} not found`);
      }

      // Check if board name exists
      const existingBoard = await this.prisma.board.findFirst({
        where: { name: toTitleCase(createDto.name) }
      });
      if (existingBoard) {
        throw new ConflictException('Board with this name already exists');
      }

      return await this.prisma.board.create({
        data: {
          name: toTitleCase(createDto.name),
          abbreviation: createDto.abbreviation.toUpperCase(),
          address: {
            connect: { id: createDto.address_id }
          }
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
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
        data: {
          ...updateBoardDto,
          name: updateBoardDto.name ? toTitleCase(updateBoardDto.name) : undefined,
          abbreviation: updateBoardDto.abbreviation ? updateBoardDto.abbreviation.toUpperCase() : undefined,
        },
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

  async remove(id: number) {
    try {
      // First check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }

      // Check for associated schools
      const schoolCount = await this.prisma.school.count({
        where: { board_id: id }
      });

      if (schoolCount > 0) {
        throw new ConflictException(
          `Cannot delete board as it is associated with ${schoolCount} school${schoolCount > 1 ? 's' : ''}`
        );
      }

      // Start transaction for cascading delete
      await this.prisma.$transaction(async (prisma) => {
        // Delete all medium_standard_subjects related to this board's components
        await prisma.medium_Standard_Subject.deleteMany({
          where: {
            OR: [
              {
                instruction_medium: {
                  board_id: id
                }
              },
              {
                standard: {
                  board_id: id
                }
              },
              {
                subject: {
                  board_id: id
                }
              }
            ]
          }
        });

        // Delete instruction mediums
        await prisma.instruction_Medium.deleteMany({
          where: { board_id: id }
        });

        // Delete standards
        await prisma.standard.deleteMany({
          where: { board_id: id }
        });

        // Delete subjects
        await prisma.subject.deleteMany({
          where: { board_id: id }
        });

        // Finally delete the board
        await prisma.board.delete({
          where: { id }
        });
      });

    } catch (error) {
      this.logger.error(`Failed to delete board ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete board');
    }
  }
}
