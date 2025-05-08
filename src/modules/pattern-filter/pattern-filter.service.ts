import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterPatternDto, FilterPatternsWithMarksDto } from './dto/filter-pattern.dto';

@Injectable()
export class PatternFilterService {
  private readonly logger = new Logger(PatternFilterService.name);

  constructor(private prisma: PrismaService) {}

  async filterPatterns(filterDto: FilterPatternsWithMarksDto) {
    try {
      const { mediumIds, chapterIds, questionOrigin, marks } = filterDto;

      // Get the standard and subject IDs from the first chapter
      // We assume all chapters in the array belong to the same standard and subject
      if (!chapterIds || chapterIds.length === 0) {
        throw new BadRequestException('At least one chapter must be provided');
      }

      // Fetch chapter info to get standard and subject
      const chapterInfo = await this.prisma.chapter.findUnique({
        where: { id: chapterIds[0] },
        select: {
          standard_id: true,
          subject_id: true
        }
      });

      if (!chapterInfo) {
        throw new NotFoundException(`Chapter with ID ${chapterIds[0]} not found`);
      }

      const { standard_id: standardId, subject_id: subjectId } = chapterInfo;

      // First, create a mapping of question types to available questions count
      const questionTypeMapping = await this.createQuestionTypeMapping(chapterIds, mediumIds, questionOrigin);
      
      this.logger.debug(`Question type mapping: ${JSON.stringify(questionTypeMapping)}`);

      // Step 1: Find all patterns that match the base criteria (standard, subject, marks)
      const basePatterns = await this.prisma.pattern.findMany({
        where: {
          standard_id: standardId,
          subject_id: subjectId,
          total_marks: marks,
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

      // Step 2: For each pattern, check if there are enough questions of each type using the mapping
      const validPatterns = [];
      const invalidPatterns = [];

      for (const pattern of basePatterns) {
        const { isValid, reason } = this.checkPatternEligibility(pattern, questionTypeMapping);

        if (isValid) {
          validPatterns.push(pattern);
        } else {
          invalidPatterns.push({
            patternId: pattern.id,
            patternName: pattern.pattern_name,
            reason: reason
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
      const { mediumIds, chapterIds, questionOrigin } = filterDto;

      // Get the standard and subject IDs from the first chapter
      // We assume all chapters in the array belong to the same standard and subject
      if (!chapterIds || chapterIds.length === 0) {
        throw new BadRequestException('At least one chapter must be provided');
      }

      // Fetch chapter info to get standard and subject
      const chapterInfo = await this.prisma.chapter.findUnique({
        where: { id: chapterIds[0] },
        select: {
          standard_id: true,
          subject_id: true
        }
      });

      if (!chapterInfo) {
        throw new NotFoundException(`Chapter with ID ${chapterIds[0]} not found`);
      }

      const { standard_id: standardId, subject_id: subjectId } = chapterInfo;

      // First, create a mapping of question types to available questions count
      const questionTypeMapping = await this.createQuestionTypeMapping(chapterIds, mediumIds, questionOrigin);

      // Find all patterns that match the base criteria
      const basePatterns = await this.prisma.pattern.findMany({
        where: {
          standard_id: standardId,
          subject_id: subjectId,
        },
        select: {
          id: true,
          total_marks: true,
          sections: {
            select: {
              id: true,
              total_questions: true,
              subsection_question_types: {
                select: {
                  id: true,
                  seqencial_subquestion_number: true,
                  question_type_id: true
                }
              }
            }
          }
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
      
      // Check each pattern if it has enough questions based on the mapping
      for (const pattern of basePatterns) {
        const { isValid } = this.checkPatternEligibility(pattern, questionTypeMapping);
        
        if (isValid) {
          uniqueMarksSet.add(pattern.total_marks);
        }
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

  /**
   * Creates a mapping of question types to their available quantities across all chapters
   */
  private async createQuestionTypeMapping(
    chapterIds: number[],
    mediumIds?: number[],
    questionOrigin?: string
  ): Promise<Map<number, number>> {
    try {
      // Get all question types from the database
      const questionTypes = await this.prisma.question_Type.findMany({
        select: { id: true }
      });
      
      // Initialize mapping with all question types set to 0
      const questionTypeMapping = new Map<number, number>();
      questionTypes.forEach(qt => questionTypeMapping.set(qt.id, 0));
      
      // Count questions for each type across all chapters
      for (const typeId of questionTypeMapping.keys()) {
        const count = await this.countQuestionsOfTypeInChapters(
          typeId,
          chapterIds,
          mediumIds,
          questionOrigin
        );
        questionTypeMapping.set(typeId, count);
      }
      
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
    questionTypeMapping: Map<number, number>
  ): { isValid: boolean; reason?: string } {
    try {
      // Get question type requirements for this pattern
      const patternRequirements = new Map<number, number>();
      
      // Process all sections to build the requirements
      for (const section of pattern.sections) {
        // If the section has specific subsection question types
        if (section.subsection_question_types && section.subsection_question_types.length > 0) {
          for (const sqt of section.subsection_question_types) {
            const questionTypeId = sqt.question_type_id;
            const currentCount = patternRequirements.get(questionTypeId) || 0;
            
            // If sequence number is 0, it applies to all questions in section
            if (sqt.seqencial_subquestion_number === 0) {
              patternRequirements.set(questionTypeId, currentCount + section.total_questions);
            } else {
              patternRequirements.set(questionTypeId, currentCount + 1);
            }
          }
        } else {
          // If no specific question types defined, it might be invalid pattern data
          this.logger.warn(`Section ${section.id} has no defined question types`);
        }
      }
      
      // Check each required question type against the mapping
      for (const [typeId, requiredCount] of patternRequirements.entries()) {
        const availableCount = questionTypeMapping.get(typeId) || 0;
        
        // Calculate minimum required: half of available with ceiling for odd numbers
        const minimumRequired = Math.ceil(availableCount / 2);
        
        if (requiredCount > minimumRequired) {
          return { 
            isValid: false, 
            reason: `Not enough questions of type ID ${typeId}. Required: ${requiredCount}, Available: ${availableCount}, Half+Ceiling: ${minimumRequired}`
          };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      this.logger.error('Error checking pattern eligibility:', error);
      return { isValid: false, reason: 'Error during pattern validation' };
    }
  }

  private async countQuestionsOfTypeInChapters(
    questionTypeId: number,
    chapterIds: number[],
    mediumIds?: number[],
    questionOrigin?: string
  ): Promise<number> {
    try {
      // Build the query conditions
      let whereCondition: any = {
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

      // Handle medium filtering differently based on number of mediums
      if (mediumIds && mediumIds.length > 0) {
        if (mediumIds.length === 1) {
          // If only one medium, simply filter questions available in that medium
          whereCondition.question_texts = {
            some: {
              question_text_topics: {
                some: {
                  instruction_medium_id: mediumIds[0]
                }
              }
            }
          };
        } else {
          // If multiple mediums, count questions that are available in ALL specified mediums
          // We need to use a different approach to ensure the question is available in all mediums
          
          // First get all questions of this type that match basic criteria (without medium filter)
          const questionsWithoutMediumFilter = await this.prisma.question.findMany({
            where: whereCondition,
            select: {
              id: true,
              question_texts: {
                select: {
                  id: true,
                  question_text_topics: {
                    select: {
                      instruction_medium_id: true
                    }
                  }
                }
              }
            }
          });
          
          // Then filter them to only include questions available in all specified mediums
          const filteredQuestions = questionsWithoutMediumFilter.filter(question => {
            // Get all unique mediums this question is available in
            const availableMediums = new Set<number>();
            
            for (const text of question.question_texts) {
              for (const topic of text.question_text_topics) {
                availableMediums.add(topic.instruction_medium_id);
              }
            }
            
            // Check if ALL requested mediums are available for this question
            return mediumIds.every(mediumId => availableMediums.has(mediumId));
          });
          
          // Return the count of filtered questions
          return filteredQuestions.length;
        }
      }

      // If we reach here, we're doing a simple count with the where condition
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