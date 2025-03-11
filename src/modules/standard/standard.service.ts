import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStandardDto, UpdateStandardDto } from './dto/standard.dto';
import { ReorderStandardDto } from './dto/reorder-standard.dto';
import { Standard } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class StandardService {
  private readonly logger = new Logger(StandardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createStandardDto: CreateStandardDto): Promise<Standard> {
    try {
      return await this.executeWithRetry(async () => {
        return await this.prisma.$transaction(async (tx) => {
          // Lock the board record to prevent concurrent modifications
          await tx.board.findUnique({
            where: { id: createStandardDto.board_id },
            select: { id: true }
          });
          
          // Generate a unique sequence number with a random offset to avoid collisions
          let sequenceNumber = createStandardDto.sequence_number;
          
          if (sequenceNumber === undefined) {
            // Auto-assign the next available sequence number
            const highestSequence = await tx.standard.findFirst({
              where: { board_id: createStandardDto.board_id },
              orderBy: { sequence_number: 'desc' },
              select: { sequence_number: true }
            });
            
            sequenceNumber = (highestSequence?.sequence_number || 0) + 1;
            this.logger.log(`Auto-assigning sequence number: ${sequenceNumber}`);
          } else {
            // Check if the requested sequence number is already taken
            const existingStandard = await tx.standard.findFirst({
              where: {
                board_id: createStandardDto.board_id,
                sequence_number: sequenceNumber
              }
            });
            
            if (existingStandard) {
              // Find a guaranteed unique sequence number by getting the highest + a random offset
              const highestSequence = await tx.standard.findFirst({
                where: { board_id: createStandardDto.board_id },
                orderBy: { sequence_number: 'desc' },
                select: { sequence_number: true }
              });
              
              // Add a random offset between 1-100 to avoid collisions with concurrent requests
              const randomOffset = Math.floor(Math.random() * 100) + 1;
              sequenceNumber = (highestSequence?.sequence_number || 0) + randomOffset;
              this.logger.log(`Position ${createStandardDto.sequence_number} is already taken. Using position ${sequenceNumber} instead.`);
            }
          }
          
          // Create the standard with the unique sequence number
          const newStandard = await tx.standard.create({
            data: {
              name: createStandardDto.name,
              sequence_number: sequenceNumber,
              board_id: createStandardDto.board_id,
              // Add any other fields from your DTO that need to be included
            }
          });
          
          return newStandard;
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Use serializable isolation for stronger guarantees
        });
      }, 5, 200); // Increase max retries and base delay
    } catch (error) {
      this.logger.error(`Failed to create standard: ${error.message}`);
      throw error;
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
      const standard = await this.findOne(id);

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
      
      // Check if sequence number is being updated and if it's already used
      if (updateDto.sequence_number !== undefined && 
          updateDto.sequence_number !== standard.sequence_number) {
        
        const existingSequence = await this.prisma.standard.findFirst({
          where: {
            board_id: updateDto.board_id || standard.board_id,
            sequence_number: updateDto.sequence_number,
            NOT: { id }
          }
        });
        
        if (existingSequence) {
          throw new ConflictException(`Sequence number ${updateDto.sequence_number} is already used in this board`);
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

  async reorderStandard(standardId: number, newPosition: number, boardId?: number): Promise<Standard> {
    try {
      return await this.executeWithRetry(() => this.performReordering(standardId, newPosition, boardId));
    } catch (error) {
      this.logger.error(`Reorder failed for standard ${standardId}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to reorder standard: ${error.message}`);
    }
  }

  private async performReordering(standardId: number, newPosition: number, boardId?: number): Promise<Standard> {
    // Get the standard to be reordered
    const standard = await this.prisma.standard.findUnique({
      where: { id: standardId },
    });

    if (!standard) {
      throw new NotFoundException(`Standard with ID ${standardId} not found`);
    }

    const currentPosition = standard.sequence_number;
    
    // If position is the same, no need to reorder
    if (currentPosition === newPosition) {
      return standard;
    }

    // Determine if we're moving to an earlier or later position
    const isMovingEarlier = newPosition < currentPosition;
    this.logger.log(`Moving standard from ${currentPosition} to ${newPosition} (${isMovingEarlier ? 'earlier' : 'later'} position)`);

    return await this.prisma.$transaction(async (tx) => {
      // First move to temporary position to avoid unique constraint conflicts
      this.logger.log(`Moving standard ${standardId} to temporary position`);
      await tx.standard.update({
        where: { id: standardId },
        data: { sequence_number: -1 }, // Temporary negative position to avoid conflicts
      });

      // Get standards that need to be shifted
      const standardsToShift = await tx.standard.findMany({
        where: {
          id: { not: standardId },
          ...(boardId ? { board_id: boardId } : {}),
          sequence_number: isMovingEarlier 
            ? { gte: newPosition, lt: currentPosition }  // Moving earlier
            : { gt: currentPosition, lte: newPosition }  // Moving later
        },
        orderBy: {
          sequence_number: isMovingEarlier ? 'desc' : 'asc' // Process in order to avoid conflicts
        }
      });

      // Update each standard individually to avoid unique constraint violations
      for (const standardToShift of standardsToShift) {
        const newSeq = isMovingEarlier 
          ? standardToShift.sequence_number + 1 
          : standardToShift.sequence_number - 1;
        
        await tx.standard.update({
          where: { id: standardToShift.id },
          data: { sequence_number: newSeq }
        });
      }

      // Finally, move the standard to its final position
      this.logger.log(`Moving standard ${standardId} to final position ${newPosition}`);
      const updatedStandard = await tx.standard.update({
        where: { id: standardId },
        data: { sequence_number: newPosition },
      });

      return updatedStandard;
    });
  }

  /**
   * Executes a function with retry logic for handling deadlocks and conflicts
   * @param fn The function to execute with retry logic
   * @param maxRetries Maximum number of retries (default: 3)
   * @param baseDelay Base delay in ms between retries (default: 100ms)
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 100
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if this is a deadlock error (PostgreSQL error code 40P01)
        // or a conflict error related to sequence numbers
        const isDeadlock = 
          error.code === 'P2034' || // Prisma transaction failed
          error.message?.includes('deadlock detected') ||
          error.message?.includes('40P01');
        
        const isSequenceConflict = 
          error instanceof ConflictException && 
          error.message?.includes('Sequence number') && 
          error.message?.includes('already used');
        
        if ((!isDeadlock && !isSequenceConflict) || attempt === maxRetries) {
          throw error;
        }
        
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        this.logger.log(`${isDeadlock ? 'Deadlock' : 'Sequence conflict'} detected, retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
} 