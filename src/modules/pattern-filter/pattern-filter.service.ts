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
      const patternRequirements = this.buildPatternRequirements(pattern);
      
      // Validate requirements against available questions
      return this.validateRequirements(patternRequirements, questionTypeMapping);
    } catch (error) {
      this.logger.error('Error checking pattern eligibility:', error);
      return { isValid: false, reason: 'Error during pattern validation' };
    }
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
  private processSection(section: any, requirements: Map<number, number>): void {
    // Skip if section has no subsection question types
    if (!section.subsection_question_types || section.subsection_question_types.length === 0) {
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
  private getAdditionalCount(subsectionQuestionType: any, section: any): number {
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
    questionTypeMapping: Map<number, number>
  ): { isValid: boolean; reason?: string } {
    // Check each required question type against the mapping
    for (const [typeId, requiredCount] of requirements.entries()) {
      const availableCount = questionTypeMapping.get(typeId) || 0;
      const minimumRequired = Math.ceil(availableCount / 2);
      
      if (requiredCount > minimumRequired) {
        return { 
          isValid: false, 
          reason: `Not enough questions of type ID ${typeId}. Required: ${requiredCount}, Available: ${availableCount}, Half+Ceiling: ${minimumRequired}`
        };
      }
    }
    
    return { isValid: true };
  }

  private async countQuestionsOfTypeInChapters(
    questionTypeId: number,
    chapterIds: number[],
    mediumIds?: number[],
    questionOrigin?: string
  ): Promise<number> {
    try {
      // Build base query condition
      const whereCondition = this.buildBaseWhereCondition(questionTypeId, chapterIds);
      
      // Add origin filter if specified
      this.addOriginFilter(whereCondition, questionOrigin);
      
      // Handle medium filtering
      if (mediumIds && mediumIds.length > 0) {
        return await this.countQuestionsWithMediumFilter(whereCondition, mediumIds);
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
  private buildBaseWhereCondition(questionTypeId: number, chapterIds: number[]): any {
    return {
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
  private async countQuestionsWithMediumFilter(whereCondition: any, mediumIds: number[]): Promise<number> {
    // Handle single medium case
    if (mediumIds.length === 1) {
      whereCondition.question_texts = {
        some: {
          question_text_topics: {
            some: {
              instruction_medium_id: mediumIds[0]
            }
          }
        }
      };
      return await this.prisma.question.count({ where: whereCondition });
    }
    
    // Handle multiple mediums case
    return await this.countQuestionsWithMultipleMediums(whereCondition, mediumIds);
  }
  
  /**
   * Counts questions available in all specified mediums
   */
  private async countQuestionsWithMultipleMediums(whereCondition: any, mediumIds: number[]): Promise<number> {
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
                instruction_medium_id: true
              }
            }
          }
        }
      }
    });
    
    // Filter questions available in all mediums
    const filteredQuestions = questionsWithoutMediumFilter.filter(question => {
      const availableMediums = this.getAvailableMediums(question);
      return mediumIds.every(mediumId => availableMediums.has(mediumId));
    });
    
    return filteredQuestions.length;
  }
  
  /**
   * Gets a set of available medium IDs for a question
   */
  private getAvailableMediums(question: any): Set<number> {
    const availableMediums = new Set<number>();
    
    for (const text of question.question_texts) {
      for (const topic of text.question_text_topics) {
        availableMediums.add(topic.instruction_medium_id);
      }
    }
    
    return availableMediums;
  }
} 