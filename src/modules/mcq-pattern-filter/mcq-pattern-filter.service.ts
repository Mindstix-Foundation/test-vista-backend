import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FilterMcqPatternDto,
  FilterMcqPatternsWithMarksDto,
} from './dto/filter-mcq-pattern.dto';

// Constant for MCQ question type ID based on database structure
const MCQ_QUESTION_TYPE_ID = 1;

@Injectable()
export class McqPatternFilterService {
  private readonly logger = new Logger(McqPatternFilterService.name);

  constructor(private prisma: PrismaService) {}

  async filterPatterns(filterDto: FilterMcqPatternsWithMarksDto) {
    const { mediumIds, chapterIds, questionOrigin, marks } = filterDto;

    this.logger.log(
      `Filtering MCQ patterns with criteria: ${JSON.stringify(filterDto)}`,
    );

    if (!chapterIds || chapterIds.length === 0) {
      throw new BadRequestException('Chapter IDs are required');
    }

    // Get chapter information to determine standard and subject IDs
    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds },
      },
      select: {
        id: true,
        subject_id: true,
        standard_id: true,
      },
    });

    if (chapters.length === 0) {
      throw new NotFoundException('No chapters found with provided IDs');
    }

    if (chapters.length !== chapterIds.length) {
      const foundIds = chapters.map((c) => c.id);
      const missingIds = chapterIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Chapters not found with IDs: ${missingIds.join(', ')}`,
      );
    }

    // Get all unique standard and subject IDs from chapters
    const standardIds = [...new Set(chapters.map((c) => c.standard_id))];
    const subjectIds = [...new Set(chapters.map((c) => c.subject_id))];

    this.logger.log(`Found standards: ${standardIds}, subjects: ${subjectIds}`);

    // Get topics for the selected chapters
    const topics = await this.prisma.topic.findMany({
      where: {
        chapter_id: { in: chapterIds },
      },
    });

    const topicIds = topics.map((t) => t.id);
    this.logger.log(`Found ${topicIds.length} topics for selected chapters`);

    // Get patterns that match the criteria and contain ONLY MCQ question types
    const patterns = await this.prisma.pattern.findMany({
      where: {
        ...(marks ? { total_marks: marks } : {}),
        sections: {
          some: {
            subsection_question_types: {
              some: {
                question_type_id: MCQ_QUESTION_TYPE_ID,
              },
            },
          },
        },
      },
      include: {
        sections: {
          include: {
            subsection_question_types: {
              include: {
                question_type: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Found ${patterns.length} patterns with MCQ question types`,
    );

    // Filter patterns to only include those with EXCLUSIVELY MCQ question types
    const mcqOnlyPatterns = patterns.filter((pattern) => {
      const allQuestionTypes = pattern.sections.flatMap((section) =>
        section.subsection_question_types.map((sqt) => sqt.question_type_id),
      );
      const uniqueQuestionTypes = [...new Set(allQuestionTypes)];

      // Only include patterns that have ONLY MCQ question type (ID = 1)
      return (
        uniqueQuestionTypes.length === 1 &&
        uniqueQuestionTypes[0] === MCQ_QUESTION_TYPE_ID
      );
    });

    this.logger.log(
      `Found ${mcqOnlyPatterns.length} patterns with exclusively MCQ question types`,
    );

    // Create question type mapping for MCQ only
    const questionTypeMapping = await this.createQuestionTypeMapping(
      chapterIds,
      mediumIds,
      questionOrigin,
    );

    // Check eligibility for each MCQ-only pattern
    const results = await Promise.all(
      mcqOnlyPatterns.map(async (pattern) => {
        const isEligible = this.checkPatternEligibility(
          pattern,
          questionTypeMapping,
        );

        return {
          pattern,
          isEligible: isEligible.isValid,
          reason: isEligible.reason,
          questionCounts: isEligible.isValid
            ? await this.getQuestionCounts(
                pattern,
                topicIds,
                mediumIds,
                questionOrigin,
              )
            : null,
        };
      }),
    );

    const validPatterns = results
      .filter((r) => r.isEligible)
      .map((r) => ({
        ...r.pattern,
        questionCounts: r.questionCounts,
      }));

    const invalidPatterns = results
      .filter((r) => !r.isEligible)
      .map((r) => ({
        ...r.pattern,
        reason: r.reason,
      }));

    this.logger.log(
      `Eligible MCQ patterns: ${validPatterns.length}, Ineligible: ${invalidPatterns.length}`,
    );

    return {
      validPatterns,
      invalidPatterns,
      totalPatterns: mcqOnlyPatterns.length,
      eligibleCount: validPatterns.length,
    };
  }

  async getUniqueMarks(filterDto: FilterMcqPatternDto) {
    const { mediumIds, chapterIds, questionOrigin } = filterDto;

    this.logger.log(
      `Getting unique marks from MCQ patterns with criteria: ${JSON.stringify(filterDto)}`,
    );

    if (!chapterIds || chapterIds.length === 0) {
      throw new BadRequestException('Chapter IDs are required');
    }

    // Get chapter information
    const chapters = await this.prisma.chapter.findMany({
      where: {
        id: { in: chapterIds },
      },
      select: {
        id: true,
        subject_id: true,
        standard_id: true,
      },
    });

    if (chapters.length === 0) {
      throw new NotFoundException('No chapters found with provided IDs');
    }

    // Get topics for the selected chapters
    const topics = await this.prisma.topic.findMany({
      where: {
        chapter_id: { in: chapterIds },
      },
    });

    const topicIds = topics.map((t) => t.id);

    // Get patterns that contain ONLY MCQ question types
    const patterns = await this.prisma.pattern.findMany({
      where: {
        sections: {
          some: {
            subsection_question_types: {
              some: {
                question_type_id: MCQ_QUESTION_TYPE_ID,
              },
            },
          },
        },
      },
      include: {
        sections: {
          include: {
            subsection_question_types: {
              include: {
                question_type: true,
              },
            },
          },
        },
      },
    });

    // Filter patterns to only include those with EXCLUSIVELY MCQ question types
    const mcqOnlyPatterns = patterns.filter((pattern) => {
      const allQuestionTypes = pattern.sections.flatMap((section) =>
        section.subsection_question_types.map((sqt) => sqt.question_type_id),
      );
      const uniqueQuestionTypes = [...new Set(allQuestionTypes)];

      // Only include patterns that have ONLY MCQ question type (ID = 1)
      return (
        uniqueQuestionTypes.length === 1 &&
        uniqueQuestionTypes[0] === MCQ_QUESTION_TYPE_ID
      );
    });

    // Create question type mapping for MCQ only
    const questionTypeMapping = await this.createQuestionTypeMapping(
      chapterIds,
      mediumIds,
      questionOrigin,
    );

    // Filter eligible patterns
    const eligiblePatterns = [];
    for (const pattern of mcqOnlyPatterns) {
      const eligibilityResult = this.checkPatternEligibility(
        pattern,
        questionTypeMapping,
      );
      if (eligibilityResult.isValid) {
        eligiblePatterns.push(pattern);
      }
    }

    // Extract unique marks from eligible MCQ-only patterns
    const uniqueMarks = [
      ...new Set(eligiblePatterns.map((p) => p.total_marks)),
    ].sort((a, b) => a - b);

    this.logger.log(
      `Found ${uniqueMarks.length} unique marks values from eligible MCQ patterns`,
    );

    return {
      marks: uniqueMarks,
      totalEligiblePatterns: eligiblePatterns.length,
    };
  }

  /**
   * Creates a mapping of question types to available question counts for MCQ only
   */
  private async createQuestionTypeMapping(
    chapterIds: number[],
    mediumIds?: number[],
    questionOrigin?: string,
  ): Promise<Map<number, number>> {
    try {
      const questionTypeMapping = new Map<number, number>();

      // Only count MCQ questions (question_type_id = 1)
      const count = await this.countQuestionsOfTypeInChapters(
        MCQ_QUESTION_TYPE_ID,
        chapterIds,
        mediumIds,
        questionOrigin,
      );

      questionTypeMapping.set(MCQ_QUESTION_TYPE_ID, count);

      return questionTypeMapping;
    } catch (error) {
      this.logger.error('Error creating question type mapping:', error);
      return new Map<number, number>();
    }
  }

  /**
   * Checks if a pattern is eligible based on the question type mapping
   */
  private checkPatternEligibility(
    pattern: any,
    questionTypeMapping: Map<number, number>,
  ): { isValid: boolean; reason?: string } {
    try {
      // Get question type requirements for this pattern
      const patternRequirements = this.buildPatternRequirements(pattern);

      // Validate requirements against available questions
      return this.validateRequirements(
        patternRequirements,
        questionTypeMapping,
      );
    } catch (error) {
      this.logger.error('Error checking pattern eligibility:', error);
      return { isValid: false, reason: 'Error during pattern validation' };
    }
  }

  /**
   * Gets question counts for a pattern
   */
  private async getQuestionCounts(
    pattern: any,
    topicIds: number[],
    mediumIds?: number[],
    questionOrigin?: string,
  ): Promise<any> {
    const counts = {};

    // Since we only deal with MCQ patterns, count MCQ questions
    const mcqCount = await this.countQuestionsOfTypeInChapters(
      MCQ_QUESTION_TYPE_ID,
      topicIds,
      mediumIds,
      questionOrigin,
    );

    counts[MCQ_QUESTION_TYPE_ID] = mcqCount;

    return counts;
  }

  /**
   * Builds a map of question type requirements from pattern sections
   */
  private buildPatternRequirements(pattern: any): Map<number, number> {
    const patternRequirements = new Map<number, number>();

    // Process all sections to build the requirements
    for (const section of pattern.sections) {
      this.processSection(section, patternRequirements);
    }

    return patternRequirements;
  }

  /**
   * Processes a single section to update question type requirements
   */
  private processSection(
    section: any,
    requirements: Map<number, number>,
  ): void {
    // Skip if section has no subsection question types
    if (
      !section.subsection_question_types ||
      section.subsection_question_types.length === 0
    ) {
      this.logger.warn(`Section ${section.id} has no defined question types`);
      return;
    }

    // Process each subsection question type
    for (const sqt of section.subsection_question_types) {
      const questionTypeId = sqt.question_type_id;
      const currentCount = requirements.get(questionTypeId) || 0;
      const additionalCount = this.getAdditionalCount(sqt, section);

      requirements.set(questionTypeId, currentCount + additionalCount);
    }
  }

  /**
   * Gets additional count for a question type based on sequential number
   */
  private getAdditionalCount(
    subsectionQuestionType: any,
    section: any,
  ): number {
    // If sequence number is 0, it applies to all questions in section
    return subsectionQuestionType.seqencial_subquestion_number === 0
      ? section.total_questions
      : 1;
  }

  /**
   * Validates requirements against available questions
   */
  private validateRequirements(
    requirements: Map<number, number>,
    questionTypeMapping: Map<number, number>,
  ): { isValid: boolean; reason?: string } {
    // Check each required question type against the mapping
    for (const [typeId, requiredCount] of requirements.entries()) {
      const availableCount = questionTypeMapping.get(typeId) || 0;
      const minimumRequired = Math.ceil(availableCount / 2);

      if (requiredCount > minimumRequired) {
        return {
          isValid: false,
          reason: `Not enough MCQ questions. Required: ${requiredCount}, Available: ${availableCount}, Half+Ceiling: ${minimumRequired}`,
        };
      }
    }

    return { isValid: true };
  }

  private async countQuestionsOfTypeInChapters(
    questionTypeId: number,
    chapterIds: number[],
    mediumIds?: number[],
    questionOrigin?: string,
  ): Promise<number> {
    try {
      // Build base query condition
      const whereCondition = this.buildBaseWhereCondition(
        questionTypeId,
        chapterIds,
      );

      // Add origin filter if specified
      this.addOriginFilter(whereCondition, questionOrigin);

      // Handle medium filtering
      if (mediumIds && mediumIds.length > 0) {
        return await this.countQuestionsWithMediumFilter(
          whereCondition,
          mediumIds,
        );
      }

      // If no medium filter, perform a simple count
      return await this.prisma.question.count({ where: whereCondition });
    } catch (error) {
      this.logger.error('Error counting questions:', error);
      return 0;
    }
  }

  /**
   * Builds the base where condition for question queries
   */
  private buildBaseWhereCondition(
    questionTypeId: number,
    chapterIds: number[],
  ): any {
    return {
      question_type_id: questionTypeId,
      question_topics: {
        some: {
          topic: {
            chapter_id: {
              in: chapterIds,
            },
          },
        },
      },
    };
  }

  /**
   * Adds origin filter to the where condition if specified
   */
  private addOriginFilter(whereCondition: any, questionOrigin?: string): void {
    if (!questionOrigin) return;

    if (questionOrigin === 'board') {
      whereCondition.board_question = true;
    } else if (questionOrigin === 'other') {
      whereCondition.board_question = false;
    }
    // For 'both', we don't add any filter
  }

  /**
   * Counts questions with medium filtering
   */
  private async countQuestionsWithMediumFilter(
    whereCondition: any,
    mediumIds: number[],
  ): Promise<number> {
    // Handle single medium case
    if (mediumIds.length === 1) {
      whereCondition.question_texts = {
        some: {
          question_text_topics: {
            some: {
              instruction_medium_id: mediumIds[0],
              is_verified: true,
            },
          },
        },
      };
      return await this.prisma.question.count({ where: whereCondition });
    }

    // Handle multiple mediums case
    return await this.countQuestionsWithMultipleMediums(
      whereCondition,
      mediumIds,
    );
  }

  /**
   * Counts questions available in all specified mediums
   */
  private async countQuestionsWithMultipleMediums(
    whereCondition: any,
    mediumIds: number[],
  ): Promise<number> {
    // Get questions without medium filter
    const questionsWithoutMediumFilter = await this.prisma.question.findMany({
      where: whereCondition,
      select: {
        id: true,
        question_texts: {
          select: {
            id: true,
            question_text_topics: {
              select: {
                instruction_medium_id: true,
              },
              where: {
                is_verified: true,
              },
            },
          },
        },
      },
    });

    // Filter questions that have verified text in all required mediums
    const validQuestions = questionsWithoutMediumFilter.filter((question) => {
      const availableMediums = this.getAvailableMediums(question);
      return mediumIds.every((mediumId) => availableMediums.has(mediumId));
    });

    return validQuestions.length;
  }

  /**
   * Gets available mediums for a question
   */
  private getAvailableMediums(question: any): Set<number> {
    const mediums = new Set<number>();

    for (const questionText of question.question_texts) {
      for (const topicMedium of questionText.question_text_topics) {
        mediums.add(topicMedium.instruction_medium_id);
      }
    }

    return mediums;
  }
}
