import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SyllabusBridgeService } from '../syllabus/syllabus-bridge.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { CheckQuestionTypeDto } from './dto/check-question-type.dto';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syllabusBridge: SyllabusBridgeService,
  ) {}

  private async bridgeSync(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (error) {
      this.logger.warn(`Syllabus bridge sync failed: ${error?.message ?? error}`);
    }
  }

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

      // Determine the next sequential chapter number
      // Find the highest existing sequential number for this subject and standard
      const highestChapter = await this.prisma.chapter.findFirst({
        where: {
          subject_id: createChapterDto.subject_id,
          standard_id: createChapterDto.standard_id,
        },
        orderBy: {
          sequential_chapter_number: 'desc',
        },
      });

      // If no chapters exist, start with 1, otherwise increment the highest
      const sequential_chapter_number = highestChapter ? highestChapter.sequential_chapter_number + 1 : 1;

      const chapterData = {
        ...createChapterDto,
        sequential_chapter_number,
        name: toTitleCase(createChapterDto.name),
      };

      const chapter = await this.prisma.chapter.create({
        data: chapterData,
        include: {
          subject: true,
          standard: true,
          topics: true,
        },
      });

      void this.bridgeSync(() => this.syllabusBridge.syncChapter(chapter.id));
      return chapter;
    } catch (error) {
      this.logger.error('Failed to create chapter:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create chapter');
    }
  }

  async findAll(subjectId?: number, standardId?: number, mediumId?: number) {
    try {
      this.assertMediumFilterHasSubjectAndStandard(mediumId, subjectId, standardId);

      if (mediumId && subjectId && standardId) {
        const mssExists = await this.mediumStandardSubjectExists(mediumId, standardId, subjectId);
        if (!mssExists) {
          this.logger.warn(
            `No Medium_Standard_Subject for medium=${mediumId}, standard=${standardId}, subject=${subjectId} — returning empty chapters`,
          );
          return [];
        }
      }

      const chapters = await this.prisma.chapter.findMany({
        where: this.buildChapterWhereClause(subjectId, standardId),
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

      if (mediumId && chapters.length) {
        return this.attachVerifiedQuestionCounts(chapters, mediumId);
      }

      return chapters;
    } catch (error) {
      this.logger.error('Failed to fetch chapters:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch chapters');
    }
  }

  private assertMediumFilterHasSubjectAndStandard(
    mediumId?: number,
    subjectId?: number,
    standardId?: number,
  ): void {
    if (mediumId && (!subjectId || !standardId)) {
      this.logger.warn('Medium filter requires both subject and standard IDs');
      throw new BadRequestException('Please provide both subject ID and standard ID when filtering by medium ID');
    }
  }

  private buildChapterWhereClause(subjectId?: number, standardId?: number) {
    const where: any = {};
    if (subjectId) {
      where.subject_id = subjectId;
    }
    if (standardId) {
      where.standard_id = standardId;
    }
    return where;
  }

  private async mediumStandardSubjectExists(
    mediumId: number,
    standardId: number,
    subjectId: number,
  ) {
    return this.prisma.medium_Standard_Subject.findFirst({
      where: {
        instruction_medium_id: mediumId,
        standard_id: standardId,
        subject_id: subjectId
      }
    });
  }

  private async attachVerifiedQuestionCounts(chapters: { id: number }[], mediumId: number) {
    const chapterIds = chapters.map((c) => c.id);
    const counts = await this.prisma.question_Text_Topic_Medium.groupBy({
      by: ['question_topic_id'],
      where: {
        instruction_medium_id: mediumId,
        is_verified: true,
        question_topic: {
          topic: { chapter_id: { in: chapterIds } },
        },
      },
      _count: { _all: true },
    });
    const topicLinks = await this.prisma.question_Topic.findMany({
      where: { id: { in: counts.map((c) => c.question_topic_id) } },
      select: { id: true, topic: { select: { chapter_id: true } } },
    });
    const topicToChapter = new Map(topicLinks.map((t) => [t.id, t.topic.chapter_id]));
    const byChapter = new Map<number, number>();
    for (const row of counts) {
      const chapterId = topicToChapter.get(row.question_topic_id);
      if (!chapterId) continue;
      byChapter.set(chapterId, (byChapter.get(chapterId) || 0) + row._count._all);
    }
    return chapters.map((c) => ({
      ...c,
      question_count: byChapter.get(c.id) || 0,
    }));
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

  private async verifySubject(subjectId?: number): Promise<void> {
    if (!subjectId) return;
    
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
  }

  private async verifyStandard(standardId?: number): Promise<void> {
    if (!standardId) return;
    
    const standard = await this.prisma.standard.findUnique({
      where: { id: standardId },
    });
    
    if (!standard) {
      throw new NotFoundException('Standard not found');
    }
  }

  private async checkDuplicateSequence(
    id: number,
    subjectId: number,
    standardId: number,
    sequentialNumber: number,
  ): Promise<void> {
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

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    try {
      const existingChapter = await this.findOne(id);

      // Verify subject and standard if provided
      await this.verifySubject(updateChapterDto.subject_id);
      await this.verifyStandard(updateChapterDto.standard_id);

      // Check for duplicate sequence if changing relevant fields
      const needsSequenceCheck = updateChapterDto.sequential_chapter_number !== undefined || 
                                updateChapterDto.subject_id !== undefined || 
                                updateChapterDto.standard_id !== undefined;
      
      if (needsSequenceCheck) {
        const subjectId = updateChapterDto.subject_id ?? existingChapter.subject_id;
        const standardId = updateChapterDto.standard_id ?? existingChapter.standard_id;
        const sequentialNumber = updateChapterDto.sequential_chapter_number ?? existingChapter.sequential_chapter_number;
        
        await this.checkDuplicateSequence(id, subjectId, standardId, sequentialNumber);
      }

      const chapterData = {
        ...updateChapterDto,
        name: updateChapterDto.name ? toTitleCase(updateChapterDto.name) : undefined,
      };

      const chapter = await this.prisma.chapter.update({
        where: { id },
        data: chapterData,
        include: {
          subject: true,
          standard: true,
          topics: true,
        },
      });

      void this.bridgeSync(() => this.syllabusBridge.syncChapter(chapter.id));
      return chapter;
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

      await this.syllabusBridge.removeSyncedChapter(id);

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

  private async validateChapterAndPosition(chapterId: number, newPosition: number) {
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

    return { currentChapter, currentPosition: currentChapter.sequential_chapter_number };
  }
  
  private async updateChapterPositions(tx, currentChapter, currentPosition, newPosition) {
    if (currentPosition < newPosition) {
      // Moving to a later position - shift chapters in between down by 1
      await tx.chapter.updateMany({
        where: {
          subject_id: currentChapter.subject_id,
          standard_id: currentChapter.standard_id,
          sequential_chapter_number: {
            gt: currentPosition,
            lte: newPosition
          }
        },
        data: {
          sequential_chapter_number: { decrement: 1 }
        }
      });
    } else {
      // Moving to an earlier position - shift chapters in between up by 1
      await tx.chapter.updateMany({
        where: {
          subject_id: currentChapter.subject_id,
          standard_id: currentChapter.standard_id,
          sequential_chapter_number: {
            gte: newPosition,
            lt: currentPosition
          }
        },
        data: {
          sequential_chapter_number: { increment: 1 }
        }
      });
    }
  }

  async reorderChapter(chapterId: number, newPosition: number) {
    try {
      this.logger.log(`Starting reorder for chapter ${chapterId} to position ${newPosition}`);
      
      const { currentChapter, currentPosition } = await this.validateChapterAndPosition(chapterId, newPosition);
      
      // If the positions are the same, no need to reorder
      if (currentPosition === newPosition) {
        return await this.findOne(chapterId);
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // First move chapter to temporary position to avoid constraints
          this.logger.log(`Moving chapter ${chapterId} to temporary position`);
          await tx.chapter.update({
            where: { id: chapterId },
            data: { sequential_chapter_number: 999 }
          });

          // Update positions of other chapters
          await this.updateChapterPositions(tx, currentChapter, currentPosition, newPosition);

          // Finally, move to new position
          this.logger.log(`Moving chapter to final position ${newPosition}`);
          await tx.chapter.update({
            where: { id: chapterId },
            data: { sequential_chapter_number: newPosition }
          });
        });

        void this.bridgeSync(() => this.syllabusBridge.syncChapter(chapterId));
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

  async checkQuestionType(checkQuestionTypeDto: CheckQuestionTypeDto) {
    const { chapterIds, patternId, mediumIds } = checkQuestionTypeDto;

    // Validate chapters exist
    const chapters = await this.prisma.chapter.findMany({
      where: { id: { in: chapterIds } },
    });

    if (chapters.length !== chapterIds.length) {
      const foundIds = new Set(chapters.map(chapter => chapter.id));
      const missingIds = chapterIds.filter(id => !foundIds.has(id));
      throw new NotFoundException(`Chapters not found with IDs: ${missingIds.join(', ')}`);
    }

    // Validate pattern exists
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: patternId },
      include: {
        sections: {
          include: {
            subsection_question_types: {
              include: {
                question_type: true
              }
            }
          }
        }
      }
    });

    if (!pattern) {
      throw new NotFoundException(`Pattern not found with ID: ${patternId}`);
    }

    // Get all question types from the pattern's sections
    const questionTypeIds = [...new Set(
      pattern.sections.flatMap(section => 
        section.subsection_question_types.map(sqt => sqt.question_type_id)
      )
    )];

    // Validate mediums if provided
    if (mediumIds && mediumIds.length > 0) {
      const mediums = await this.prisma.instruction_Medium.findMany({
        where: { id: { in: mediumIds } },
      });

      if (mediums.length !== mediumIds.length) {
        const foundIds = new Set(mediums.map(medium => medium.id));
        const missingIds = mediumIds.filter(id => !foundIds.has(id));
        throw new NotFoundException(`Instruction mediums not found with IDs: ${missingIds.join(', ')}`);
      }
    }

    // Get all topics for the chapters
    const topics = await this.prisma.topic.findMany({
      where: {
        chapter_id: { in: chapterIds }
      }
    });

    const topicIds = topics.map(topic => topic.id);

    // Get questions for these topics and question types
    const questions = await this.prisma.question.findMany({
      where: {
        question_type_id: { in: questionTypeIds },
        question_topics: {
          some: {
            topic_id: { in: topicIds },
            question_text_topics: {
              some: {
                is_verified: true,
                ...(mediumIds?.length > 0 ? {
                  instruction_medium_id: { in: mediumIds }
                } : {})
              }
            }
          }
        }
      },
      include: {
        question_type: true,
        question_topics: {
          include: {
            topic: true,
            question_text_topics: {
              where: mediumIds?.length > 0 ? {
                instruction_medium_id: { in: mediumIds }
              } : undefined
            }
          }
        }
      }
    });

    // Process the results
    const questionTypes = [...new Set(
      pattern.sections.flatMap(section => 
        section.subsection_question_types.map(sqt => ({
          type: sqt.question_type_id,
          name: sqt.question_type.type_name
        }))
      )
    )];

    const questionTypeResults = questionTypes.map(qt =>
      this.buildQuestionTypeChapterCounts(qt, chapters, topics, questions, mediumIds),
    );

    // Calculate total by summing up all chapter counts
    const total = questionTypeResults.reduce((sum, qt) => 
      sum + qt.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.count, 0)
    , 0);

    return {
      success: true,
      data: {
        questionTypes: questionTypeResults,
        total // This will now be the sum of all chapter counts
      }
    };
  }

  private buildQuestionTypeChapterCounts(
    questionType: { type: number; name: string },
    chapters: { id: number; name: string }[],
    topics: { id: number; chapter_id: number }[],
    questions: any[],
    mediumIds?: number[],
  ) {
    const chaptersWithType = chapters
      .map((chapter) => this.buildChapterQuestionCount(chapter, questionType.type, topics, questions, mediumIds))
      .filter((chapter) => chapter.count > 0);

    return {
      type: questionType.type,
      name: questionType.name,
      chapters: chaptersWithType,
    };
  }

  private buildChapterQuestionCount(
    chapter: { id: number; name: string },
    questionTypeId: number,
    topics: { id: number; chapter_id: number }[],
    questions: any[],
    mediumIds?: number[],
  ) {
    const chapterTopicIds = topics
      .filter((topic) => topic.chapter_id === chapter.id)
      .map((topic) => topic.id);

    return {
      id: chapter.id,
      name: chapter.name,
      count: this.countMatchingQuestions(questions, questionTypeId, chapterTopicIds, mediumIds),
    };
  }

  private countMatchingQuestions(
    questions: any[],
    questionTypeId: number,
    chapterTopicIds: number[],
    mediumIds?: number[],
  ): number {
    return questions.filter((question) =>
      this.questionMatchesChapterType(question, questionTypeId, chapterTopicIds, mediumIds),
    ).length;
  }

  private questionMatchesChapterType(
    question: any,
    questionTypeId: number,
    chapterTopicIds: number[],
    mediumIds?: number[],
  ): boolean {
    if (question.question_type_id !== questionTypeId) {
      return false;
    }
    if (!question.question_topics.some((qt) => chapterTopicIds.includes(qt.topic_id))) {
      return false;
    }
    if (!mediumIds?.length) {
      return true;
    }
    return question.question_topics.some(
      (qt) => qt.question_text_topics.length === mediumIds.length,
    );
  }
} 