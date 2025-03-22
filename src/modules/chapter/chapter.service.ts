import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(private prisma: PrismaService) {}

  async create(createChapterDto: CreateChapterDto) {
    try {
      // Verify subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: createChapterDto.subject_id },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }

      // Verify standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: createChapterDto.standard_id },
      });

      if (!standard) {
        throw new NotFoundException('Standard not found');
      }

      // Check for duplicate chapter sequence
      const existingChapter = await this.prisma.chapter.findFirst({
        where: {
          subject_id: createChapterDto.subject_id,
          standard_id: createChapterDto.standard_id,
          sequential_chapter_number: createChapterDto.sequential_chapter_number,
        },
      });

      if (existingChapter) {
        throw new ConflictException(
          `Chapter with sequence number ${createChapterDto.sequential_chapter_number} already exists for this subject and standard`,
        );
      }

      const chapterData = {
        ...createChapterDto,
        name: toTitleCase(createChapterDto.name),
      };

      return await this.prisma.chapter.create({
        data: chapterData,
        include: {
          subject: true,
          standard: true,
          topics: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create chapter:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create chapter');
    }
  }

  async findAll(subjectId?: number, standardId?: number) {
    try {
      // Build where clause based on provided filters
      const where: any = {};
      
      if (subjectId) {
        where.subject_id = subjectId;
      }
      
      if (standardId) {
        where.standard_id = standardId;
      }

      return await this.prisma.chapter.findMany({
        where,
        include: {
          subject: true,
          standard: true,
          topics: {
            orderBy: {
              sequential_topic_number: 'asc'
            }
          },
        },
        orderBy: {
          sequential_chapter_number: 'asc'
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch chapters:', error);
      throw new InternalServerErrorException('Failed to fetch chapters');
    }
  }

  async findOne(id: number) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id },
        include: {
          subject: true,
          standard: true,
          topics: true,
        },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      return chapter;
    } catch (error) {
      this.logger.error(`Failed to fetch chapter ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch chapter');
    }
  }

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    try {
      const existingChapter = await this.findOne(id);

      // Verify subject if provided
      if (updateChapterDto.subject_id) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: updateChapterDto.subject_id },
        });

        if (!subject) {
          throw new NotFoundException('Subject not found');
        }
      }

      // Verify standard if provided
      if (updateChapterDto.standard_id) {
        const standard = await this.prisma.standard.findUnique({
          where: { id: updateChapterDto.standard_id },
        });

        if (!standard) {
          throw new NotFoundException('Standard not found');
        }
      }

      // Check for duplicate sequence if changing subject, standard or sequence
      if (updateChapterDto.sequential_chapter_number || 
          updateChapterDto.subject_id || 
          updateChapterDto.standard_id) {
        
        const subjectId = updateChapterDto.subject_id || existingChapter.subject_id;
        const standardId = updateChapterDto.standard_id || existingChapter.standard_id;
        const sequentialNumber = updateChapterDto.sequential_chapter_number || existingChapter.sequential_chapter_number;
        
        const duplicateSequence = await this.prisma.chapter.findFirst({
          where: {
            id: { not: id },
            subject_id: subjectId,
            standard_id: standardId,
            sequential_chapter_number: sequentialNumber,
          },
        });

        if (duplicateSequence) {
          throw new ConflictException(
            `Chapter with sequence number ${sequentialNumber} already exists for this subject and standard`,
          );
        }
      }

      const chapterData = {
        ...updateChapterDto,
        name: updateChapterDto.name ? toTitleCase(updateChapterDto.name) : undefined,
      };

      return await this.prisma.chapter.update({
        where: { id },
        data: chapterData,
        include: {
          subject: true,
          standard: true,
          topics: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update chapter ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update chapter');
    }
  }

  async remove(id: number) {
    try {
      const chapterToDelete = await this.findOne(id);
      const currentPosition = chapterToDelete.sequential_chapter_number;
      const subjectId = chapterToDelete.subject_id;
      const standardId = chapterToDelete.standard_id;

      await this.prisma.$transaction(async (tx) => {
        // First delete the chapter
        await tx.chapter.delete({
          where: { id }
        });

        // Update sequence numbers for remaining chapters
        const chaptersToUpdate = await tx.chapter.findMany({
          where: {
            subject_id: subjectId,
            standard_id: standardId,
            sequential_chapter_number: {
              gt: currentPosition
            }
          },
          orderBy: {
            sequential_chapter_number: 'asc'
          }
        });

        for (const chapter of chaptersToUpdate) {
          await tx.chapter.update({
            where: { id: chapter.id },
            data: {
              sequential_chapter_number: chapter.sequential_chapter_number - 1
            }
          });
        }
      });

      return { message: 'Chapter deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete chapter ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete chapter');
    }
  }

  async reorderChapter(chapterId: number, newPosition: number) {
    try {
      this.logger.log(`Starting reorder for chapter ${chapterId} to position ${newPosition}`);
      
      // Get the current chapter and its details
      const currentChapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        select: {
          id: true,
          subject_id: true,
          standard_id: true,
          sequential_chapter_number: true
        }
      });

      if (!currentChapter) {
        throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
      }

      this.logger.log(`Found current chapter: ${JSON.stringify(currentChapter)}`);

      // Get total chapters count to validate newPosition
      const totalChapters = await this.prisma.chapter.count({
        where: { 
          subject_id: currentChapter.subject_id,
          standard_id: currentChapter.standard_id
        }
      });

      this.logger.log(`Total chapters in subject/standard: ${totalChapters}`);

      // Validate newPosition
      if (newPosition < 1 || newPosition > totalChapters) {
        throw new ConflictException(`New position must be between 1 and ${totalChapters}`);
      }

      const currentPosition = currentChapter.sequential_chapter_number;

      // If the positions are the same, no need to reorder
      if (currentPosition === newPosition) {
        return await this.findOne(chapterId);
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // First move to temporary position
          this.logger.log(`Moving chapter ${chapterId} to temporary position`);
          await tx.chapter.update({
            where: { id: chapterId },
            data: { sequential_chapter_number: 999 }
          });

          if (currentPosition < newPosition) {
            // Moving to a later position
            for (let i = currentPosition + 1; i <= newPosition; i++) {
              await tx.chapter.updateMany({
                where: {
                  subject_id: currentChapter.subject_id,
                  standard_id: currentChapter.standard_id,
                  sequential_chapter_number: i
                },
                data: {
                  sequential_chapter_number: i - 1
                }
              });
            }
          } else {
            // Moving to an earlier position
            for (let i = currentPosition - 1; i >= newPosition; i--) {
              await tx.chapter.updateMany({
                where: {
                  subject_id: currentChapter.subject_id,
                  standard_id: currentChapter.standard_id,
                  sequential_chapter_number: i
                },
                data: {
                  sequential_chapter_number: i + 1
                }
              });
            }
          }

          // Finally, move to new position
          this.logger.log(`Moving chapter to final position ${newPosition}`);
          await tx.chapter.update({
            where: { id: chapterId },
            data: { sequential_chapter_number: newPosition }
          });
        });

        return await this.findOne(chapterId);
      } catch (txError) {
        this.logger.error(`Transaction failed: ${txError.message}`, txError.stack);
        throw new InternalServerErrorException(`Failed to reorder: ${txError.message}`);
      }
    } catch (error) {
      this.logger.error(`Reorder failed for chapter ${chapterId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to reorder chapter: ${error.message}`);
    }
  }
} 