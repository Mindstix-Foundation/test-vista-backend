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
      const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id: createChapterDto.medium_standard_subject_id },
      });

      if (!mediumStandardSubject) {
        throw new NotFoundException('Medium Standard Subject not found');
      }

      const existingChapter = await this.prisma.chapter.findFirst({
        where: {
          medium_standard_subject_id: createChapterDto.medium_standard_subject_id,
          sequential_chapter_number: createChapterDto.sequential_chapter_number,
        },
      });

      if (existingChapter) {
        throw new ConflictException(
          `Chapter with sequence number ${createChapterDto.sequential_chapter_number} already exists for this medium standard subject`,
        );
      }

      const chapterData = {
        ...createChapterDto,
        name: toTitleCase(createChapterDto.name),
      };

      return await this.prisma.chapter.create({
        data: chapterData,
        include: {
          medium_standard_subject: true,
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

  async findAll(mediumStandardSubjectId?: number) {
    try {
      const where = mediumStandardSubjectId 
        ? { medium_standard_subject_id: mediumStandardSubjectId }
        : {};

      return await this.prisma.chapter.findMany({
        where,
        include: {
          medium_standard_subject: true,
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
          medium_standard_subject: true,
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

      if (updateChapterDto.medium_standard_subject_id) {
        const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
          where: { id: updateChapterDto.medium_standard_subject_id },
        });

        if (!mediumStandardSubject) {
          throw new NotFoundException('Medium Standard Subject not found');
        }
      }

      if (updateChapterDto.sequential_chapter_number) {
        const duplicateSequence = await this.prisma.chapter.findFirst({
          where: {
            id: { not: id },
            medium_standard_subject_id: updateChapterDto.medium_standard_subject_id || existingChapter.medium_standard_subject_id,
            sequential_chapter_number: updateChapterDto.sequential_chapter_number,
          },
        });

        if (duplicateSequence) {
          throw new ConflictException(
            `Chapter with sequence number ${updateChapterDto.sequential_chapter_number} already exists for this medium standard subject`,
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
          medium_standard_subject: true,
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

      await this.prisma.$transaction(async (tx) => {
        // First delete the chapter
        await tx.chapter.delete({
          where: { id }
        });

        // Update sequence numbers for remaining chapters one by one
        const chaptersToUpdate = await tx.chapter.findMany({
          where: {
            medium_standard_subject_id: chapterToDelete.medium_standard_subject_id,
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

  async reorderChapter(chapterId: number, newPosition: number, mediumStandardSubjectId?: number) {
    try {
      this.logger.log(`Starting reorder for chapter ${chapterId} to position ${newPosition}`);
      
      // Get the current chapter and its details
      const currentChapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        select: {
          id: true,
          medium_standard_subject_id: true,
          sequential_chapter_number: true
        }
      });

      if (!currentChapter) {
        throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
      }

      this.logger.log(`Found current chapter: ${JSON.stringify(currentChapter)}`);

      // If mediumStandardSubjectId is provided, verify it matches
      if (mediumStandardSubjectId && mediumStandardSubjectId !== currentChapter.medium_standard_subject_id) {
        throw new ConflictException('Chapter does not belong to the specified medium standard subject');
      }

      // Get total chapters count to validate newPosition
      const totalChapters = await this.prisma.chapter.count({
        where: { medium_standard_subject_id: currentChapter.medium_standard_subject_id }
      });

      this.logger.log(`Total chapters in subject: ${totalChapters}`);

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
                  medium_standard_subject_id: currentChapter.medium_standard_subject_id,
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
                  medium_standard_subject_id: currentChapter.medium_standard_subject_id,
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