import { 
  Injectable, 
  Logger, 
  NotFoundException,
  InternalServerErrorException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StandardService } from '../standard/standard.service';
import { CreateBoardManagementDto } from './dto/create-board-management.dto';
import { UpdateBoardManagementDto } from './dto/update-board-management.dto';
import { BoardManagementData } from './interfaces/board-management.interface';

@Injectable()
export class BoardManagementService {
  private readonly logger = new Logger(BoardManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly standardService: StandardService,
  ) {}

  async create(createDto: CreateBoardManagementDto): Promise<BoardManagementData> {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // Create address first using direct Prisma operation
        const address = await prisma.address.create({
          data: {
            street: createDto.address.street,
            postal_code: createDto.address.postal_code,
            city_id: createDto.address.city_id,
          },
          include: {
            city: {
              include: {
                state: {
                  include: {
                    country: true
                  }
                }
              }
            }
          }
        });

        // Create board with address using direct Prisma operation
        const board = await prisma.board.create({
          data: {
            name: createDto.board.name,
            abbreviation: createDto.board.abbreviation,
            address_id: address.id,
          },
        });

        // Create instruction mediums using direct Prisma operations
        const instructionMediums = await Promise.all(
          createDto.instructionMediums.map((medium) =>
            prisma.instruction_Medium.create({
              data: {
                instruction_medium: medium.name,
                board_id: board.id,
              },
            }),
          ),
        );

        // Create standards with auto-generated sequence numbers
        const standards = await Promise.all(
          createDto.standards.map(async (standard, index) =>
            prisma.standard.create({
              data: {
                name: standard.name,
                board_id: board.id,
                sequence_number: index, // Auto-assign sequence based on order
              },
            }),
          ),
        );

        // Create subjects using direct Prisma operations
        const subjects = await Promise.all(
          createDto.subjects.map((subject) =>
            prisma.subject.create({
              data: {
                name: subject.name,
                board_id: board.id,
              },
            }),
          ),
        );

        return {
          board,
          address,
          instruction_mediums: instructionMediums,
          standards,
          subjects,
        };
      } catch (error) {
        this.logger.error('Failed to create board management:', error);
        throw error;
      }
    });
  }

  async findAll(): Promise<BoardManagementData[]> {
    try {
      // Single optimized query to get all boards with related data
      const boards = await this.prisma.board.findMany({
        include: {
          address: {
            include: {
              city: {
                include: {
                  state: {
                    include: {
                      country: true
                    }
                  }
                }
              }
            }
          },
          instruction_mediums: true,
          standards: {
            orderBy: { sequence_number: 'asc' }
          },
          subjects: true,
        },
        orderBy: { created_at: 'desc' }
      });

      return boards.map(board => ({
        board: {
          id: board.id,
          name: board.name,
          abbreviation: board.abbreviation,
          address_id: board.address_id,
          created_at: board.created_at,
          updated_at: board.updated_at,
        },
        address: board.address,
        instruction_mediums: board.instruction_mediums,
        standards: board.standards,
        subjects: board.subjects,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch all boards:', error);
      throw new InternalServerErrorException('Failed to fetch all boards');
    }
  }

  async findOne(id: number): Promise<BoardManagementData> {
    try {
      // Single optimized query to get board with all related data
      const board = await this.prisma.board.findUnique({
        where: { id },
        include: {
          address: {
            include: {
              city: {
                include: {
                  state: {
                    include: {
                      country: true
                    }
                  }
                }
              }
            }
          },
          instruction_mediums: true,
          standards: {
            orderBy: { sequence_number: 'asc' }
          },
          subjects: true,
        },
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }

      return {
        board: {
          id: board.id,
          name: board.name,
          abbreviation: board.abbreviation,
          address_id: board.address_id,
          created_at: board.created_at,
          updated_at: board.updated_at,
        },
        address: board.address,
        instruction_mediums: board.instruction_mediums,
        standards: board.standards,
        subjects: board.subjects,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch board with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to fetch board with ID ${id}`);
    }
  }

  async remove(id: number) {
    try {
      const board = await this.prisma.board.findUnique({
        where: { id },
        select: { id: true, address_id: true }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }

      await this.prisma.$transaction(async (prisma) => {
        // Delete all related entities using direct Prisma operations
        // Prisma will handle cascade deletes based on schema relationships
        await prisma.instruction_Medium.deleteMany({
          where: { board_id: id }
        });

        await prisma.standard.deleteMany({
          where: { board_id: id }
        });

        await prisma.subject.deleteMany({
          where: { board_id: id }
        });

        // Delete the board
        await prisma.board.delete({
          where: { id }
        });

        // Delete the address
        await prisma.address.delete({
          where: { id: board.address_id }
        });
      });

      return { message: `Board with ID ${id} and all related entities deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete board with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to delete board with ID ${id}`);
    }
  }

  async update(id: number, updateDto: UpdateBoardManagementDto): Promise<BoardManagementData> {
    // First, collect standards that need reordering (before the transaction)
    const standardsToReorder: Array<{ id: number; currentSequence: number; newSequence: number }> = [];
    
    if (updateDto.standards && updateDto.standards.some(s => s.id && s.sequence_number !== undefined)) {
      // Get current standards to determine which ones need reordering
      const currentStandards = await this.prisma.standard.findMany({
        where: { board_id: id },
        select: { id: true, sequence_number: true },
        orderBy: { sequence_number: 'asc' }
      });

      const currentSequenceMap = new Map(
        currentStandards.map(s => [s.id, s.sequence_number])
      );

      // Identify standards that need reordering
      updateDto.standards.forEach(standard => {
        if (standard.id && standard.sequence_number !== undefined) {
          const currentSequence = currentSequenceMap.get(standard.id);
          if (currentSequence !== undefined && currentSequence !== standard.sequence_number) {
            standardsToReorder.push({
              id: standard.id,
              currentSequence,
              newSequence: standard.sequence_number
            });
          }
        }
      });
    }

    // Execute the main transaction (without sequence number updates)
    const result = await this.prisma.$transaction(async (prisma) => {
      try {
        // Check if board exists
        const existingBoard = await prisma.board.findUnique({
          where: { id },
          select: { id: true, address_id: true }
        });

        if (!existingBoard) {
          throw new NotFoundException(`Board with ID ${id} not found`);
        }

        // Update board if provided
        if (updateDto.board) {
          await prisma.board.update({
            where: { id },
            data: {
              name: updateDto.board.name,
              abbreviation: updateDto.board.abbreviation,
            }
          });
        }

        // Update address if provided
        if (updateDto.address) {
          await prisma.address.update({
            where: { id: existingBoard.address_id },
            data: {
              street: updateDto.address.street,
              postal_code: updateDto.address.postal_code,
              city_id: updateDto.address.city_id,
            }
          });
        }

        // Handle deletions first
        await this.handleDeletions(id, updateDto, prisma);

        // Update child entities (without sequence number updates for standards)
        await this.updateChildEntities(id, updateDto, prisma);

        // Return updated data using findOne
        return await this.findOne(id);
      } catch (error) {
        this.logger.error(`Failed to update board management with ID ${id}:`, error);
        throw error;
      }
    });

    // Handle standards reordering outside the transaction using StandardService
    if (standardsToReorder.length > 0) {
      this.logger.log(`Reordering ${standardsToReorder.length} standards for board ${id}`);
      
      for (const reorderOp of standardsToReorder) {
        this.logger.log(`Reordering standard ${reorderOp.id} from position ${reorderOp.currentSequence} to ${reorderOp.newSequence}`);
        await this.standardService.reorderStandard(reorderOp.id, reorderOp.newSequence, id);
      }
      
      // Fetch the final result after reordering
      return await this.findOne(id);
    }

    return result;
  }

  /**
   * Handles deletion of entities before updates
   */
  private async handleDeletions(boardId: number, updateDto: UpdateBoardManagementDto, prisma: any): Promise<void> {
    // Delete instruction mediums
    if (updateDto.deleteInstructionMediumIds && updateDto.deleteInstructionMediumIds.length > 0) {
      // First delete related school instruction mediums
      await prisma.school_Instruction_Medium.deleteMany({
        where: { instruction_medium_id: { in: updateDto.deleteInstructionMediumIds } }
      });
      
      await prisma.instruction_Medium.deleteMany({
        where: { 
          id: { in: updateDto.deleteInstructionMediumIds },
          board_id: boardId 
        }
      });
    }

    // Delete standards
    if (updateDto.deleteStandardIds && updateDto.deleteStandardIds.length > 0) {
      // First delete related school standards
      await prisma.school_Standard.deleteMany({
        where: { standard_id: { in: updateDto.deleteStandardIds } }
      });
      
      await prisma.standard.deleteMany({
        where: { 
          id: { in: updateDto.deleteStandardIds },
          board_id: boardId 
        }
      });
    }

    // Delete subjects
    if (updateDto.deleteSubjectIds && updateDto.deleteSubjectIds.length > 0) {
      await prisma.subject.deleteMany({
        where: { 
          id: { in: updateDto.deleteSubjectIds },
          board_id: boardId 
        }
      });
    }
  }

  /**
   * Updates child entities (instruction mediums, standards, subjects) for a board
   */
  private async updateChildEntities(boardId: number, updateDto: UpdateBoardManagementDto, prisma?: any): Promise<void> {
    // Update instruction mediums if provided
    if (updateDto.instructionMediums) {
      await Promise.all(
        updateDto.instructionMediums.map(async (medium: any) => {
          return medium.id
            ? prisma.instruction_Medium.update({
                where: { id: medium.id },
                data: { instruction_medium: medium.name }
              })
            : prisma.instruction_Medium.create({
                data: {
                  instruction_medium: medium.name,
                  board_id: boardId,
                }
              });
        }),
      );
    }

    // Update standards if provided (but NOT sequence numbers - those are handled separately)
    if (updateDto.standards) {
      await Promise.all(
        updateDto.standards.map(async (standard: any, index: number) => {
          if (standard.id) {
            // Update existing standard - ONLY update name, not sequence_number
            return prisma.standard.update({
              where: { id: standard.id },
              data: { name: standard.name }
            });
          } else {
            // Create new standard with next available sequence number
            return prisma.standard.create({
              data: {
                name: standard.name,
                board_id: boardId,
                sequence_number: await this.getNextSequenceNumber(boardId, prisma),
              }
            });
          }
        }),
      );
    }

    // Update subjects if provided
    if (updateDto.subjects) {
      await Promise.all(
        updateDto.subjects.map(async (subject: any) => {
          return subject.id
            ? prisma.subject.update({
                where: { id: subject.id },
                data: { name: subject.name }
              })
            : prisma.subject.create({
                data: {
                  name: subject.name,
                  board_id: boardId,
                }
              });
        }),
      );
    }
  }

  private async getNextSequenceNumber(boardId: number, prisma?: any): Promise<number> {
    const client = prisma || this.prisma;
    const highestSequence = await client.standard.findFirst({
      where: { board_id: boardId },
      orderBy: { sequence_number: 'desc' },
      select: { sequence_number: true }
    });
    
    return highestSequence ? highestSequence.sequence_number + 1 : 0;
  }
} 