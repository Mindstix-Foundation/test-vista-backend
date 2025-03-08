import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStandardDto, UpdateStandardDto } from './dto/standard.dto';
import { ReorderStandardDto } from './dto/reorder-standard.dto';

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
        },
        orderBy: [
          { sequence_number: 'asc' },
          { name: 'asc' }
        ]
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
      // Check if standard exists with its relationships
      const standard = await this.prisma.standard.findUnique({
        where: { id },
        include: {
          board: true,
          school_standards: {
            include: {
              teacher_subjects: true,
              school: true
            }
          },
          medium_standard_subjects: {
            include: {
              chapters: {
                include: {
                  topics: true
                }
              }
            }
          }
        }
      });

      if (!standard) {
        throw new NotFoundException(`Standard with ID ${id} not found`);
      }

      // Get counts of related entities for informative message
      const relatedCounts = {
        schools: standard.school_standards.length,
        teachers: new Set(standard.school_standards.flatMap(ss => 
          ss.teacher_subjects.map(ts => ts.user_id)
        )).size,
        mediumSubjects: standard.medium_standard_subjects.length,
        chapters: standard.medium_standard_subjects.reduce((sum, mss) => 
          sum + mss.chapters.length, 0),
        topics: standard.medium_standard_subjects.reduce((sum, mss) => 
          sum + mss.chapters.reduce((chapterSum, chapter) => 
            chapterSum + chapter.topics.length, 0), 0)
      };

      // Log what will be deleted
      this.logger.log(`Deleting standard ${id} (${standard.name}) from board ${standard.board.name} will also delete:
        - ${relatedCounts.schools} school assignments
        - ${relatedCounts.teachers} teacher assignments
        - ${relatedCounts.mediumSubjects} medium-subject combinations
        - ${relatedCounts.chapters} chapters
        - ${relatedCounts.topics} topics
        and all their related records`);

      // Delete the standard - cascade will handle all related records
      await this.prisma.standard.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted standard ${id} and all related records`);
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
      orderBy: [
        { sequence_number: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async reorderStandard(standardId: number, newPosition: number, boardId?: number) {
    try {
      this.logger.log(`Starting reorder for standard ${standardId} to position ${newPosition}`);
      
      // Get the current standard and its details
      const currentStandard = await this.prisma.standard.findUnique({
        where: { id: standardId },
        select: {
          id: true,
          board_id: true,
          sequence_number: true
        }
      });

      if (!currentStandard) {
        throw new NotFoundException(`Standard with ID ${standardId} not found`);
      }

      this.logger.log(`Found current standard: ${JSON.stringify(currentStandard)}`);

      // If boardId is provided, verify it matches
      if (boardId && boardId !== currentStandard.board_id) {
        throw new ConflictException('Standard does not belong to the specified board');
      }

      // Get total standards count to validate newPosition
      const totalStandards = await this.prisma.standard.count({
        where: { board_id: currentStandard.board_id }
      });

      this.logger.log(`Total standards in board: ${totalStandards}`);

      // Validate newPosition
      if (newPosition < 0 || newPosition > totalStandards - 1) {
        throw new ConflictException(`New position must be between 0 and ${totalStandards - 1}`);
      }

      const currentPosition = currentStandard.sequence_number;

      // If the positions are the same, no need to reorder
      if (currentPosition === newPosition) {
        return await this.findOne(standardId);
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // First move to temporary position
          this.logger.log(`Moving standard ${standardId} to temporary position`);
          await tx.standard.update({
            where: { id: standardId },
            data: { sequence_number: 999 }
          });

          if (currentPosition < newPosition) {
            // Moving to a later position
            for (let i = currentPosition + 1; i <= newPosition; i++) {
              await tx.standard.updateMany({
                where: {
                  board_id: currentStandard.board_id,
                  sequence_number: i
                },
                data: {
                  sequence_number: i - 1
                }
              });
            }
          } else {
            // Moving to an earlier position
            for (let i = currentPosition - 1; i >= newPosition; i--) {
              await tx.standard.updateMany({
                where: {
                  board_id: currentStandard.board_id,
                  sequence_number: i
                },
                data: {
                  sequence_number: i + 1
                }
              });
            }
          }

          // Finally, move to new position
          this.logger.log(`Moving standard to final position ${newPosition}`);
          await tx.standard.update({
            where: { id: standardId },
            data: { sequence_number: newPosition }
          });
        });

        return await this.findOne(standardId);
      } catch (txError) {
        this.logger.error(`Transaction failed: ${txError.message}`, txError.stack);
        throw new InternalServerErrorException(`Failed to reorder: ${txError.message}`);
      }
    } catch (error) {
      this.logger.error(`Reorder failed for standard ${standardId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to reorder standard: ${error.message}`);
    }
  }
} 