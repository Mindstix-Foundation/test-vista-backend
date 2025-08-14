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
      let where: Prisma.BoardWhereInput = {};
      if (search) {
        where = {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              abbreviation: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        };
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.board.count({ where });
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.BoardOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get paginated data with sorting - only return essential fields
      const boards = await this.prisma.board.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          abbreviation: true
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
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch boards:', error);
      throw new InternalServerErrorException('Failed to fetch boards');
    }
  }

  async findAllWithoutPagination(sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string) {
    try {
      // Build where clause for search
      let where: Prisma.BoardWhereInput = {};
      if (search) {
        where = {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              abbreviation: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.BoardOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get all boards with sorting but without pagination - only return essential fields
      const boards = await this.prisma.board.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          abbreviation: true
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
      // Fetch the board with only necessary relations and fields
      const board = await this.prisma.board.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          abbreviation: true,
          address_id: true,
          created_at: true,
          updated_at: true,
          address: {
            select: {
              id: true,
              postal_code: true,
              street: true,
              city_id: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  state_id: true,
                  state: {
                    select: {
                      id: true,
                      name: true,
                      country_id: true,
                      country: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          // Sort instruction mediums alphabetically
          instruction_mediums: {
            orderBy: {
              instruction_medium: 'asc'
            },
            select: {
              id: true,
              instruction_medium: true,
              created_at: true,
              updated_at: true
            }
          },
          // Sort standards by sequence_number
          standards: {
            orderBy: {
              sequence_number: 'asc'
            },
            select: {
              id: true,
              name: true,
              sequence_number: true,
              created_at: true,
              updated_at: true
            }
          },
          // Sort subjects alphabetically
          subjects: {
            orderBy: {
              name: 'asc'
            },
            select: {
              id: true,
              name: true,
              created_at: true,
              updated_at: true
            }
          }
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
        await this.validateAddressForBoard(updateBoardDto.address_id, id);
      }
      
      // Update the board
      await this.prisma.board.update({
        where: { id },
        data: {
          ...updateBoardDto,
          name: updateBoardDto.name ? toTitleCase(updateBoardDto.name) : undefined,
          abbreviation: updateBoardDto.abbreviation ? updateBoardDto.abbreviation.toUpperCase() : undefined,
        }
      });
      
      // Return the complete updated board using findOne
      return await this.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to update board ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      this.handlePrismaErrors(error);
      throw new InternalServerErrorException('Failed to update board');
    }
  }

  private async validateAddressForBoard(addressId: number, boardId?: number) {
    // Check if address exists
    const address = await this.prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    // If boardId is provided, check if address is already used by another board
    if (boardId) {
      const existingBoard = await this.prisma.board.findFirst({
        where: {
          address_id: addressId,
          NOT: { id: boardId }
        }
      });

      if (existingBoard) {
        throw new ConflictException(`Address with ID ${addressId} is already associated with another board`);
      }
    }
  }

  private handlePrismaErrors(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Board with this name already exists');
      }
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

      // Find questions that would be orphaned after deleting this board's topics
      // First, get all topics related to this board's standards and subjects
      const boardTopics = await this.prisma.topic.findMany({
        where: {
          chapter: {
            OR: [
              { standard_id: { in: board.standards.map(s => s.id) } },
              { subject_id: { in: board.subjects.map(s => s.id) } }
            ]
          }
        },
        select: { id: true }
      });

      const topicIds = boardTopics.map(topic => topic.id);

      // Find questions that are only connected to topics from this board
      // and would become orphaned after deletion
      const orphanedQuestions = await this.prisma.question.findMany({
        where: {
          question_topics: {
            every: {
              topic_id: { in: topicIds }
            }
          }
        },
        select: { id: true }
      });

      const orphanedQuestionIds = orphanedQuestions.map(q => q.id);
      
      // Log the orphaned questions that will be deleted
      if (orphanedQuestionIds.length > 0) {
        this.logger.log(`Deleting ${orphanedQuestionIds.length} questions that would be orphaned`);
        
        // Delete the orphaned questions
        await this.prisma.question.deleteMany({
          where: {
            id: { in: orphanedQuestionIds }
          }
        });
      }

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
