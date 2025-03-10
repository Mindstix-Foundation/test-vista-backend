import { Injectable, Logger, NotFoundException,  ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { Prisma } from '@prisma/client';
import { toTitleCase } from '../../utils/titleCase';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';


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

  async findAll(page = 1, page_size = 15, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string) {
    try {
      const skip = (page - 1) * page_size;
      
      // Build where clause for search
      const where: Prisma.BoardWhereInput = {};
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.board.count({ where });
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.BoardOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get paginated data with sorting and search
      const boards = await this.prisma.board.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        include: {
          address: true,
          standards: true,
          subjects: true,
          instruction_mediums: true
        }
      });
      
      return {
        data: boards,
        meta: {
          total,
          page,
          page_size,
          total_pages: Math.ceil(total / page_size),
          sort_by,
          sort_order
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all boards:', error);
      throw new InternalServerErrorException('Failed to fetch all boards');
    }
  }

  async findAllWithoutPagination(sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string) {
    try {
      // Build where clause for search
      const where: Prisma.BoardWhereInput = {};
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.BoardOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get all boards with sorting and search but without pagination
      const boards = await this.prisma.board.findMany({
        where,
        orderBy,
        include: {
          address: true,
          standards: true,
          subjects: true,
          instruction_mediums: true
        }
      });
      
      return {
        data: boards,
        meta: {
          sort_by,
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all boards:', error);
      throw new InternalServerErrorException('Failed to fetch all boards');
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

  async remove(id: number): Promise<void> {
    try {
      // Check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id },
        include: {
          schools: true,
          standards: true,
          subjects: true,
          instruction_mediums: true
        }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }

      // Get counts of related entities for informative message
      const relatedCounts = {
        schools: board.schools.length,
        standards: board.standards.length,
        subjects: board.subjects.length,
        instruction_mediums: board.instruction_mediums.length
      };

      // Log what will be deleted
      this.logger.log(`Deleting board ${id} will also delete:
        - ${relatedCounts.schools} schools
        - ${relatedCounts.standards} standards
        - ${relatedCounts.subjects} subjects
        - ${relatedCounts.instruction_mediums} instruction mediums
        and all their related records`);

      // Delete the board - cascade will handle all related records
      await this.prisma.board.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted board ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete board ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete board');
    }
  }
}
