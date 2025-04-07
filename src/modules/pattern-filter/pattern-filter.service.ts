import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterPatternDto } from './dto/filter-pattern.dto';

@Injectable()
export class PatternFilterService {
  private readonly logger = new Logger(PatternFilterService.name);

  constructor(private prisma: PrismaService) {}

  async filterPatterns(filterDto: FilterPatternDto) {
    try {
      const { mediumId, standardId, subjectId, chapterIds, questionOrigin, marks } = filterDto;

      // Step 1: Find all patterns that match the base criteria (medium, standard, subject, marks)
      const basePatterns = await this.prisma.pattern.findMany({
        where: {
          ...(standardId && { standard_id: standardId }),
          ...(subjectId && { subject_id: subjectId }),
          ...(marks && { total_marks: marks }),
        },
        select: {
          id: true,
          pattern_name: true,
          total_marks: true,
          board_id: true,
          standard_id: true,
          subject_id: true,
          board: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            }
          },
          standard: {
            select: {
              id: true,
              name: true,
              sequence_number: true,
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
            }
          },
          sections: {
            select: {
              id: true,
              sequence_number: true,
              section_number: true,
              sub_section: true,
              section_name: true,
              total_questions: true,
              mandotory_questions: true,
              marks_per_question: true,
              subsection_question_types: {
                select: {
                  id: true,
                  seqencial_subquestion_number: true,
                  question_type_id: true,
                  question_type: {
                    select: {
                      id: true,
                      type_name: true,
                    }
                  }
                }
              }
            },
          },
        },
      });

      if (basePatterns.length === 0) {
        return {
          count: 0,
          patterns: [],
          message: 'No patterns found matching the basic criteria.'
        };
      }

      // Step 2: For each pattern, check if there are enough questions of each type
      const validPatterns = [];
      const invalidPatterns = [];

      for (const pattern of basePatterns) {
        const isValid = await this.hasEnoughQuestionsForPattern(
          pattern,
          chapterIds,
          mediumId,
          questionOrigin
        );

        if (isValid) {
          validPatterns.push(pattern);
        } else {
          invalidPatterns.push({
            patternId: pattern.id,
            patternName: pattern.pattern_name,
            reason: 'Not enough questions of required types in selected chapters.'
          });
        }
      }

      return {
        count: validPatterns.length,
        patterns: validPatterns,
        invalidPatternsCount: invalidPatterns.length,
        invalidPatterns: invalidPatterns
      };
    } catch (error) {
      this.logger.error('Error filtering patterns:', error);
      throw error;
    }
  }

  async getUniqueMarks(filterDto: FilterPatternDto) {
    try {
      const { mediumId, standardId, subjectId, chapterIds, questionOrigin } = filterDto;

      // First, find all patterns that match the base criteria
      const basePatterns = await this.prisma.pattern.findMany({
        where: {
          ...(standardId && { standard_id: standardId }),
          ...(subjectId && { subject_id: subjectId }),
        },
        select: {
          id: true,
          total_marks: true,
        },
      });

      if (basePatterns.length === 0) {
        return {
          count: 0,
          marks: [],
          message: 'No patterns found matching the basic criteria.'
        };
      }

      // Get unique marks from patterns
      const uniqueMarksSet = new Set<number>();
      const validPatternIds = [];

      // If we need to filter by questions availability
      if (chapterIds && chapterIds.length > 0) {
        // Check each pattern if it has enough questions
        for (const pattern of basePatterns) {
          // Get full pattern details
          const fullPattern = await this.prisma.pattern.findUnique({
            where: { id: pattern.id },
            select: {
              id: true,
              sections: {
                select: {
                  id: true,
                  total_questions: true,
                  subsection_question_types: {
                    select: {
                      id: true,
                      seqencial_subquestion_number: true,
                      question_type_id: true,
                      question_type: {
                        select: {
                          id: true,
                          type_name: true,
                        }
                      }
                    }
                  },
                },
              },
            },
          });

          const isValid = await this.hasEnoughQuestionsForPattern(
            fullPattern,
            chapterIds,
            mediumId,
            questionOrigin
          );

          if (isValid) {
            validPatternIds.push(pattern.id);
            uniqueMarksSet.add(pattern.total_marks);
          }
        }
      } else {
        // If no chapter filtering is needed, just get all unique marks
        basePatterns.forEach(pattern => {
          uniqueMarksSet.add(pattern.total_marks);
        });
      }

      // Convert Set to sorted array
      const uniqueMarks = Array.from(uniqueMarksSet).sort((a, b) => a - b);

      return {
        count: uniqueMarks.length,
        marks: uniqueMarks
      };
    } catch (error) {
      this.logger.error('Error retrieving unique marks:', error);
      throw error;
    }
  }

  private async hasEnoughQuestionsForPattern(
    pattern: any,
    chapterIds: number[],
    mediumId?: number,
    questionOrigin?: string
  ): Promise<boolean> {
    try {
      // For each section in the pattern
      for (const section of pattern.sections) {
        // Get question types in this section
        const questionTypeRequirements = new Map();

        // If the section has specific subsection question types
        if (section.subsection_question_types.length > 0) {
          for (const sqt of section.subsection_question_types) {
            const questionTypeId = sqt.question_type_id;
            const currentCount = questionTypeRequirements.get(questionTypeId) || 0;
            
            // If sequence number is 0, it applies to all questions in section
            if (sqt.seqencial_subquestion_number === 0) {
              questionTypeRequirements.set(questionTypeId, section.total_questions);
            } else {
              questionTypeRequirements.set(questionTypeId, currentCount + 1);
            }
          }
        } else {
          // If no specific question types defined, assume all questions are of a default type
          // You may need to adjust this based on your business logic
          this.logger.warn(`Section ${section.id} has no defined question types`);
          continue;
        }

        // Check if there are enough questions of each type
        for (const [typeId, requiredQuestions] of questionTypeRequirements.entries()) {
          const availableQuestionsCount = await this.countQuestionsOfTypeInChapters(
            typeId,
            chapterIds,
            mediumId,
            questionOrigin
          );

          // We need at least 3 times the required number
          const minimumRequired = requiredQuestions * 3;
          
          if (availableQuestionsCount < minimumRequired) {
            this.logger.warn(
              `Not enough questions of type ${typeId} for section ${section.id}. ` +
              `Required: ${minimumRequired}, Available: ${availableQuestionsCount}`
            );
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error checking question availability:', error);
      return false;
    }
  }

  private async countQuestionsOfTypeInChapters(
    questionTypeId: number,
    chapterIds: number[],
    mediumId?: number,
    questionOrigin?: string
  ): Promise<number> {
    try {
      // Build the query conditions
      const whereCondition: any = {
        question_type_id: questionTypeId,
        question_topics: {
          some: {
            topic: {
              chapter_id: {
                in: chapterIds
              }
            }
          }
        }
      };

      // Add board_question filter based on questionOrigin
      if (questionOrigin) {
        if (questionOrigin === 'board') {
          whereCondition.board_question = true;
        } else if (questionOrigin === 'other') {
          whereCondition.board_question = false;
        }
        // For 'both', we don't add any filter
      }

      // Add mediumId filter if provided
      if (mediumId) {
        whereCondition.question_texts = {
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id: mediumId
              }
            }
          }
        };
      }

      // Count questions that meet all criteria
      const count = await this.prisma.question.count({
        where: whereCondition
      });

      return count;
    } catch (error) {
      this.logger.error('Error counting questions:', error);
      return 0;
    }
  }
} 