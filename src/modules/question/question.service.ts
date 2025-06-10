import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField, CompleteQuestionDto, EditCompleteQuestionDto, RemoveQuestionFromChapterDto, AddTranslationDto, QuestionCountFilterDto } from './dto/question.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { AwsS3Service } from '../aws/aws-s3.service';

interface QuestionFilters {
  question_type_id?: number;
  topic_id?: number;
  chapter_id?: number;
  page?: number;
  page_size?: number;
  sort_by?: QuestionSortField;
  sort_order?: SortOrder;
  search?: string;
  board_question?: boolean;
  instruction_medium_id?: number;
  is_verified?: boolean;
  translation_status?: string;
}

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  /**
   * Question and Image Management Strategy
   * 
   * This service implements a file hash comparison approach for handling questions with images:
   * 
   * 1. Questions with the same text content but different images are treated as distinct questions
   * 2. Image uniqueness is determined by comparing image_ids, which are guaranteed to be unique
   * 3. The approach considers two scenarios for image differences:
   *    - One question has an image while the other doesn't
   *    - Both questions have images but with different image_ids
   * 
   * This strategy ensures that educational content with different visual representations
   * is properly managed even when the text content is identical. This is crucial for
   * subjects where the same concept may need different visual explanations.
   * 
   * The implementation is efficient as it:
   * - Doesn't require computing cryptographic hashes of image files
   * - Uses existing database constraints and relationships
   * - Minimizes storage requirements while preserving content distinctions
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service
  ) {}

  // Helper method to transform image data with presigned URLs
  private async transformImageData(image) {
    if (!image) return null;
    
    // Deep clone to avoid mutation
    const imageData = { ...image };
    
    // If no image_url, return the image data as is
    if (!imageData.image_url) {
      this.logger.warn(`Image ${imageData.id} has no image_url`);
      return imageData;
    }
    
    try {
      // Generate presigned URL with 1-hour expiration
      const presignedUrl = await this.awsS3Service.generatePresignedUrl(imageData.image_url, 3600);
      
      // Remove the original URL and add the presigned URL
      const { image_url, ...restImageData } = imageData;
      
      this.logger.debug(`Generated presigned URL for image ${imageData.id}, expires in 1 hour`);
      
      return {
        ...restImageData,
        presigned_url: presignedUrl
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for image ${imageData.id}:`, error);
      
      // Remove image_url to avoid exposing the direct S3 URL
      const { image_url, ...restImageData } = imageData;
      
      // Return the image data without the URL
      return restImageData;
    }
  }

  // Helper method to apply transformations to question results
  private async transformQuestionResults(questions) {
    if (Array.isArray(questions)) {
      return Promise.all(questions.map(question => this.transformSingleQuestion(question)));
    }
    return this.transformSingleQuestion(questions);
  }

  // Transform a single question and all its nested images
  private async transformSingleQuestion(question) {
    if (!question) return null;
    
    // Clone the question to avoid mutating the original
    const result = { ...question };
    
    // Process question texts and their images
    if (result.question_texts && result.question_texts.length > 0) {
      result.question_texts = await this.transformQuestionTexts(result.question_texts, result.id);
    }
    
    return result;
  }

  private async transformQuestionTexts(questionTexts, questionId) {
    return Promise.all(questionTexts.map(text => this.transformQuestionText(text, questionId)));
  }

  private async transformQuestionText(text, questionId) {
    if (!text) return null;
    
    // Deep clone to avoid mutation
    const textResult = { ...text };
    
    // IMPORTANT: Preserve the topic information during transformation
    this.logTopicPreservation(textResult, questionId);
    
    // Transform main image
    textResult.image = await this.transformImageIfExists(textResult.image, 
      `question text ${textResult.id}`);
    
    // Transform MCQ option images
    if (textResult.mcq_options && textResult.mcq_options.length > 0) {
      textResult.mcq_options = await this.transformMcqOptions(textResult.mcq_options);
    }
    
    // Transform match pair images
    if (textResult.match_pairs && textResult.match_pairs.length > 0) {
      textResult.match_pairs = await this.transformMatchPairs(textResult.match_pairs);
    }
    
    return textResult;
  }

  private logTopicPreservation(textResult, questionId) {
    if (textResult.topic) {
      this.logger.log(`Preserving topic info for question ${questionId}, text ${textResult.id}: ${JSON.stringify(textResult.topic)}`);
    }
  }

  private async transformImageIfExists(image, contextDescription) {
    if (!image) return null;
    
    const transformedImage = await this.transformImageData(image);
    this.logger.debug(`Transformed image ${transformedImage?.id} for ${contextDescription}`);
    return transformedImage;
  }

  private async transformMcqOptions(options) {
    return Promise.all(options.map(option => this.transformMcqOption(option)));
  }

  private async transformMcqOption(option) {
    if (!option) return null;
    
    const optionResult = { ...option };
    optionResult.image = await this.transformImageIfExists(optionResult.image, 
      `MCQ option ${optionResult.id}`);
    
    return optionResult;
  }

  private async transformMatchPairs(pairs) {
    return Promise.all(pairs.map(pair => this.transformMatchPair(pair)));
  }

  private async transformMatchPair(pair) {
    if (!pair) return null;
    
    const pairResult = { ...pair };
    pairResult.left_image = await this.transformImageIfExists(pairResult.left_image, 
      `match pair ${pairResult.id} (left)`);
    
    pairResult.right_image = await this.transformImageIfExists(pairResult.right_image, 
      `match pair ${pairResult.id} (right)`);
    
    return pairResult;
  }

  async create(createDto: CreateQuestionDto) {
    try {
      // Verify question type exists
      const questionType = await this.prisma.question_Type.findUnique({
        where: { id: createDto.question_type_id }
      });

      if (!questionType) {
        throw new NotFoundException(`Question type with ID ${createDto.question_type_id} not found`);
      }

      const question = await this.prisma.question.create({
        data: createDto,
        include: {
          question_type: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });

      // Transform question to include presigned URLs
      return await this.transformSingleQuestion(question);
    } catch (error) {
      this.logger.error('Failed to create question:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create question');
    }
  }

  async findAll(filters: QuestionFilters) {
    try {
      const {
        page = 1,
        page_size = 10,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        instruction_medium_id,
        is_verified,
        translation_status
      } = filters;
      
      // Log filter parameters
      this.logFilterParameters(filters);
      
      // Build where conditions for the query
      const whereConditions = this.buildWhereConditions(filters);
      
      // Build order by clause
      const orderBy = this.buildOrderByClause(sort_by, sort_order);
      
      // Calculate pagination values
      const skip = (page - 1) * page_size;
      const take = page_size;

      // Query total count
      const totalCount = await this.prisma.question.count({
        where: whereConditions
      });

      // Query data with pagination
      const questions = await this.fetchQuestionsWithIncludes(whereConditions, orderBy, skip, take);
      
      // Process question data
      const processingResult = await this.processQuestionData(
        questions, 
        totalCount, 
        { instruction_medium_id, is_verified, translation_status },
        { page, page_size }
      );
      
      return processingResult;
    } catch (error) {
      this.logger.error('Error in findAll questions:', error);
      throw new InternalServerErrorException('Failed to retrieve questions');
    }
  }

  private logFilterParameters(filters: QuestionFilters): void {
    const {
      instruction_medium_id,
      is_verified,
      translation_status,
      question_type_id,
      topic_id,
      chapter_id,
      board_question
    } = filters;

    this.logger.log(`findAll called with filters:
      - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
      - is_verified: ${is_verified} (${typeof is_verified})
      - translation_status: ${translation_status} (${typeof translation_status})
      - question_type_id: ${question_type_id} (${typeof question_type_id})
      - topic_id: ${topic_id} (${typeof topic_id})
      - chapter_id: ${chapter_id} (${typeof chapter_id})
      - board_question: ${board_question} (${typeof board_question})
      - all filters: ${JSON.stringify(filters)}
    `);
  }

  private buildWhereConditions(filters: QuestionFilters): any {
    const whereConditions: any = {};
    
    this.addBasicFilters(whereConditions, filters);
    this.addTopicFilters(whereConditions, filters);
    this.addMediumAndVerificationFilters(whereConditions, filters);
    this.addSearchFilter(whereConditions, filters.search);
    
    this.logger.log(`Constructed where conditions: ${JSON.stringify(whereConditions)}`);
    
    return whereConditions;
  }

  private addBasicFilters(whereConditions: any, filters: QuestionFilters): void {
    const { question_type_id, board_question } = filters;
    
    if (question_type_id !== undefined) {
      whereConditions.question_type_id = question_type_id;
    }

    if (board_question !== undefined) {
      whereConditions.board_question = board_question;
    }
  }

  private addTopicFilters(whereConditions: any, filters: QuestionFilters): void {
    const { topic_id, chapter_id } = filters;
    
    if (topic_id === undefined && chapter_id === undefined) {
      return;
    }
    
    whereConditions.question_topics = {
      some: {}
    };
    
    if (topic_id !== undefined) {
      whereConditions.question_topics.some.topic_id = topic_id;
    }
    
    if (chapter_id !== undefined) {
      whereConditions.question_topics.some.topic = {
        chapter_id
      };
    }
  }

  private addMediumAndVerificationFilters(whereConditions: any, filters: QuestionFilters): void {
    const { instruction_medium_id, is_verified, translation_status } = filters;
    
    if (instruction_medium_id === undefined && is_verified === undefined && translation_status === undefined) {
      return;
    }
    
    this.logger.log(`Applying filters:
      - instruction_medium_id: ${instruction_medium_id}
      - is_verified: ${is_verified}
      - translation_status: ${translation_status}
    `);
    
    const topicCondition = {
      question_text_topics: {
        some: {} as Record<string, any>
      }
    };
    
    if (instruction_medium_id !== undefined) {
      topicCondition.question_text_topics.some.instruction_medium_id = instruction_medium_id;
    }
    
    if (is_verified !== undefined) {
      topicCondition.question_text_topics.some.is_verified = is_verified;
    }
    
    if (translation_status !== undefined && translation_status !== null && translation_status !== '') {
      this.logger.log(`Filtering by translation_status: ${translation_status}`);
      topicCondition.question_text_topics.some.translation_status = translation_status;
    }
    
    this.addToQuestionTextsCondition(whereConditions, topicCondition);
  }

  private addToQuestionTextsCondition(whereConditions: any, conditionToAdd: any): void {
    if (whereConditions.question_texts) {
      // If we already have a question_texts condition, we need to combine them
      whereConditions.question_texts = {
        some: {
          AND: [
            whereConditions.question_texts.some,
            conditionToAdd
          ]
        }
      };
    } else {
      // Create new question_texts condition
      whereConditions.question_texts = {
        some: conditionToAdd
      };
    }
  }

  private addSearchFilter(whereConditions: any, search: string | undefined): void {
    if (!search) {
      return;
    }
    
    const searchCondition = {
      question_text: {
        contains: search,
        mode: 'insensitive' as const
      }
    };
    
    if (whereConditions.question_texts) {
      if (whereConditions.question_texts.some.AND) {
        // If we already have an AND condition, add to it
        whereConditions.question_texts.some.AND.push(searchCondition);
      } else {
        // Otherwise, create a new AND condition
        whereConditions.question_texts.some = {
          AND: [
            whereConditions.question_texts.some,
            searchCondition
          ]
        };
      }
    } else {
      // Create new question_texts condition for search
      whereConditions.question_texts = {
        some: searchCondition
      };
    }
  }

  private buildOrderByClause(sort_by: QuestionSortField, sort_order: SortOrder): any {
    const orderBy: any = {};
    
    switch (sort_by) {
      case QuestionSortField.CREATED_AT:
        orderBy.created_at = sort_order;
        break;
      case QuestionSortField.UPDATED_AT:
        orderBy.updated_at = sort_order;
        break;
      case QuestionSortField.QUESTION_TYPE:
        orderBy.question_type = {
          type_name: sort_order
        };
        break;
      case QuestionSortField.QUESTION_TEXT:
        orderBy.created_at = sort_order; // Fallback to sort by creation date
        break;
      default:
        orderBy.created_at = SortOrder.DESC;
        break;
    }
    
    this.logger.log(`Sorting with: ${JSON.stringify(orderBy)}`);
    
    return orderBy;
  }

  private async fetchQuestionsWithIncludes(whereConditions: any, orderBy: any, skip: number, take: number) {
    return this.prisma.question.findMany({
      where: whereConditions,
      orderBy,
      skip,
      take,
      include: {
        question_type: true,
        question_texts: {
          include: {
            image: true,
            mcq_options: {
              include: {
                image: true
              }
            },
            match_pairs: {
              include: {
                left_image: true,
                right_image: true
              }
            },
            question_text_topics: {
              include: {
                instruction_medium: true,
                question_topic: {
                  include: {
                    topic: true
                  }
                }
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: true
          }
        }
      }
    });
  }

  private async processQuestionData(
    questions: any[],
    totalCount: number,
    filters: { instruction_medium_id?: number, is_verified?: boolean, translation_status?: string },
    pagination: { page: number, page_size: number }
  ) {
    this.logQuestionsDebugInfo(questions);
    
    const processedQuestions = this.addTranslationStatusAndTopicInfo(questions);
    const filteredQuestions = this.filterQuestionTextsByConditions(processedQuestions, filters);
    const validQuestions = this.removeQuestionsWithNoTexts(filteredQuestions);
    
    this.logFilteringResults(questions.length, validQuestions);
    
    const questionsWithTopics = this.ensureTopicsInQuestionData(validQuestions);
    const transformedQuestions = await this.transformQuestionResults(questionsWithTopics);
    
    this.logFinalTopicInfo(transformedQuestions);
    
    const simplifiedQuestions = this.simplifyQuestionData(transformedQuestions);
    
    const { page, page_size } = pagination;
    const actualTotalCount = validQuestions.length;
    
    const totalFilteredCount = this.calculateTotalFilteredCount(
      totalCount, 
      actualTotalCount, 
      questions.length, 
      filters
    );
    
    return {
      data: simplifiedQuestions,
      meta: {
        total_count: totalFilteredCount,
        page,
        page_size,
        total_pages: Math.ceil(totalFilteredCount / page_size)
      }
    };
  }

  private logQuestionsDebugInfo(questions: any[]): void {
    questions.forEach(question => {
      this.logger.log(`Debug data for question ID ${question.id}:
        - Question type: ${question.question_type?.type_name || 'unknown'}
        - Question has ${question.question_topics?.length || 0} topics
        - Question topics: ${JSON.stringify(question.question_topics?.map(qt => ({
          id: qt.id,
          topic_id: qt.topic_id,
          topic_name: qt.topic?.name
        })))}
        - Question has ${question.question_texts?.length || 0} texts
        ${question.question_texts?.map(text => 
          `- Text ID ${text.id}: "${text.question_text.substring(0, 20)}..."
           - Has ${text.question_text_topics?.length || 0} text-topic associations
           - Text-topic associations: ${JSON.stringify(text.question_text_topics?.map(qttm => ({
              id: qttm.id,
              question_topic_id: qttm.question_topic_id,
              medium_id: qttm.instruction_medium_id,
              has_topic: qttm.question_topic?.topic != null,
              topic_name: qttm.question_topic?.topic?.name
            })))}`
        ).join('\n')}
      `);
    });
  }

  private addTranslationStatusAndTopicInfo(questions: any[]): any[] {
    return questions.map(question => {
      const processedQuestion = { ...question };
      
      if (processedQuestion.question_texts) {
        processedQuestion.question_texts = processedQuestion.question_texts.map(text => {
          const textWithStatus: any = { ...text };
          
          this.addTranslationStatusToText(textWithStatus, question);
          this.addTopicInfoToText(textWithStatus, question);
          
          return textWithStatus;
        });
      }
      
      return processedQuestion;
    });
  }

  private addTranslationStatusToText(textWithStatus: any, question: any): void {
    if (textWithStatus.question_text_topics && textWithStatus.question_text_topics.length > 0) {
      textWithStatus.translation_status = textWithStatus.question_text_topics[0].translation_status || 'original';
    } else {
      textWithStatus.translation_status = 'original'; // Default if not found
    }
  }

  private addTopicInfoToText(textWithStatus: any, question: any): void {
    // Try to get topic from question_text_topics first
    if (textWithStatus.question_text_topics && 
        textWithStatus.question_text_topics.length > 0 && 
        textWithStatus.question_text_topics[0].question_topic?.topic) {
      
      const topicData = textWithStatus.question_text_topics[0].question_topic.topic;
      textWithStatus.topic = {
        id: topicData.id,
        name: topicData.name,
        chapter_id: topicData.chapter_id
      };
      this.logger.log(`Service: Found topic in text-topic for question ${question.id}, text ${textWithStatus.id}: ${JSON.stringify(textWithStatus.topic)}`);
    } 
    // If no topic in question_text_topics, try from question_topics
    else if (question.question_topics && 
             question.question_topics.length > 0 && 
             question.question_topics[0].topic) {
      
      const topicData = question.question_topics[0].topic;
      textWithStatus.topic = {
        id: topicData.id,
        name: topicData.name,
        chapter_id: topicData.chapter_id
      };
      this.logger.log(`Service: Using default topic from question_topics for question ${question.id}, text ${textWithStatus.id}: ${JSON.stringify(textWithStatus.topic)}`);
    }
  }

  private filterQuestionTextsByConditions(
    questions: any[], 
    filters: { instruction_medium_id?: number, is_verified?: boolean, translation_status?: string }
  ): any[] {
    const { instruction_medium_id, is_verified, translation_status } = filters;
    
    // If no filter conditions, return as is
    if (instruction_medium_id === undefined && is_verified === undefined && translation_status === undefined) {
      return questions;
    }
    
    return questions.map(question => {
      const questionCopy = { ...question };
      
      questionCopy.question_texts = questionCopy.question_texts.filter(text => {
        if (!text.question_text_topics || text.question_text_topics.length === 0) {
          return false;
        }
        
        return text.question_text_topics.some(qttm => this.matchesAllFilters(qttm, filters));
      });
      
      if (questionCopy.question_texts.length === 0) {
        this.logger.warn(`Question ID ${questionCopy.id} has no matching texts after filtering`);
      }
      
      return questionCopy;
    });
  }

  private matchesAllFilters(
    qttm: any, 
    filters: { instruction_medium_id?: number, is_verified?: boolean, translation_status?: string }
  ): boolean {
    const { instruction_medium_id, is_verified, translation_status } = filters;
    let match = true;
    
    if (instruction_medium_id !== undefined) {
      match = match && qttm.instruction_medium_id === instruction_medium_id;
    }
    
    if (is_verified !== undefined) {
      match = match && qttm.is_verified === is_verified;
    }
    
    if (translation_status !== undefined && translation_status !== null && translation_status !== '') {
      this.logger.log(`Checking translation_status: ${qttm.translation_status} against required: ${translation_status}`);
      match = match && qttm.translation_status === translation_status;
    }
    
    return match;
  }

  private removeQuestionsWithNoTexts(questions: any[]): any[] {
    return questions.filter(q => q.question_texts.length > 0);
  }

  private logFilteringResults(initialCount: number, filteredQuestions: any[]): void {
    const filteredCount = filteredQuestions.length;
    
    this.logger.log(`Initial result count: ${initialCount}`);
    this.logger.log(`After filtering: ${filteredCount}`);
    
    if (filteredCount > 0) {
      const firstQuestion = filteredQuestions[0];
      // Use optional chaining and nullish coalescing to avoid errors
      const textCount = firstQuestion?.question_texts?.length ?? 0;
      this.logger.log(`First question has ${textCount} texts`);
    } else {
      this.logger.log('No questions remain after filtering');
    }
  }

  private logFinalTopicInfo(questions: any[]): void {
    for (const q of questions) {
      for (const text of q.question_texts || []) {
        this.logger.log(`Final check - Question ${q.id}, Text ${text.id}, Topic: ${JSON.stringify(text.topic)}`);
      }
    }
  }

  private calculateTotalFilteredCount(
    totalCount: number,
    actualTotalCount: number,
    originalResultsCount: number,
    filters: { instruction_medium_id?: number, is_verified?: boolean, translation_status?: string }
  ): number {
    const { instruction_medium_id, is_verified } = filters;
    let totalFilteredCount = totalCount;
    
    if (instruction_medium_id !== undefined || is_verified !== undefined) {
      // Estimate total filtered count based on ratio of actual filtered results
      const filterRatio = actualTotalCount / originalResultsCount || 0;
      totalFilteredCount = Math.ceil(totalCount * filterRatio);
      this.logger.log(`Estimated total count after all filters: ${totalFilteredCount}`);
    }
    
    return totalFilteredCount;
  }

  async findOne(id: number) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_topics: {
            include: {
              topic: true
            }
          },
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_topic: {
                    include: {
                      topic: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // First ensure topics are properly preserved/set
      const [questionWithTopics] = this.ensureTopicsInQuestionData([question]);
      
      // Log the topics at each step for debugging
      this.logger.log(`Question ${id} topics after ensuring: ${JSON.stringify(
        questionWithTopics.question_texts?.map(t => ({ text_id: t.id, topic: t.topic }))
      )}`);
      
      // Then transform images to include presigned URLs
      const transformedQuestion = await this.transformSingleQuestion(questionWithTopics);
      
      // Final check to ensure topics weren't lost
      this.logger.log(`Question ${id} topics after transformation: ${JSON.stringify(
        transformedQuestion.question_texts?.map(t => ({ text_id: t.id, topic: t.topic }))
      )}`);
      
      return transformedQuestion;
    } catch (error) {
      this.logger.error(`Error retrieving question with ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve question');
    }
  }

  async update(id: number, updateDto: UpdateQuestionDto) {
    try {
      await this.findOne(id);

      if (updateDto.question_type_id) {
        const questionType = await this.prisma.question_Type.findUnique({
          where: { id: updateDto.question_type_id }
        });

        if (!questionType) {
          throw new NotFoundException(`Question type with ID ${updateDto.question_type_id} not found`);
        }
      }

      const updatedQuestion = await this.prisma.question.update({
        where: { id },
        data: updateDto,
        include: {
          question_type: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: {
                include: {
                  chapter: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_text: true
                }
              }
            }
          }
        }
      });
      
      // Transform question to include presigned URLs
      return await this.transformSingleQuestion(updatedQuestion);
    } catch (error) {
      this.logger.error(`Failed to update question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update question');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          },
          question_topics: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // Collect images that need to be deleted from S3
      const imagesToDelete = await this.collectImagesToDelete(question);

      // Log what will be deleted
      this.logger.log(`Deleting question ${id} will also delete:
        - ${question.question_texts.length} question texts
        - ${question.question_texts.reduce((sum, qt) => sum + qt.mcq_options.length, 0)} MCQ options
        - ${question.question_texts.reduce((sum, qt) => sum + qt.match_pairs.length, 0)} match pairs
        - ${question.question_topics.length} topic associations
        - ${imagesToDelete.length} unique images from S3 that are not used elsewhere`);

      await this.prisma.question.delete({
        where: { id }
      });

      // After database deletion succeeded, delete images from S3
      if (imagesToDelete.length > 0) {
        try {
          await Promise.all(imagesToDelete.map(async (imageUrl) => {
            await this.awsS3Service.deleteFile(imageUrl);
          }));
          this.logger.log(`Successfully deleted ${imagesToDelete.length} images from S3 for question ${id}`);
        } catch (error) {
          this.logger.error(`Error deleting images from S3 for question ${id}:`, error);
          // We continue even if image deletion fails since the database records are already deleted
        }
      }

      this.logger.log(`Successfully deleted question ${id} and all related records through cascade delete`);
    } catch (error) {
      this.logger.error(`Failed to delete question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question');
    }
  }
  
  private async associateWithTopic(questionId: number, topicId: number) {
    try {
      // Check if question exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId }
      });
      
      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }
      
      // Check if topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId }
      });
      
      if (!topic) {
        throw new NotFoundException(`Topic with ID ${topicId} not found`);
      }
      
      // Create association (will fail if already exists due to unique constraint)
      return await this.prisma.question_Topic.create({
        data: {
          question_id: questionId,
          topic_id: topicId
        },
        include: {
          question: true,
          topic: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to associate question ${questionId} with topic ${topicId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to associate question with topic');
    }
  }
  
  private async removeTopicAssociation(questionId: number, topicId: number) {
    try {
      const association = await this.prisma.question_Topic.findFirst({
        where: {
          question_id: questionId,
          topic_id: topicId
        }
      });
      
      if (!association) {
        throw new NotFoundException(`Association between question ${questionId} and topic ${topicId} not found`);
      }
      
      await this.prisma.question_Topic.delete({
        where: { id: association.id }
      });
      
      this.logger.log(`Successfully removed association between question ${questionId} and topic ${topicId}`);
    } catch (error) {
      this.logger.error(`Failed to remove association between question ${questionId} and topic ${topicId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove topic association');
    }
  }

  async findAllWithoutPagination(filters: Omit<QuestionFilters, 'page' | 'page_size'>) {
    try {
      const {
        instruction_medium_id,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC
      } = filters;
      
      this.logWithoutPaginationParams(filters);
      
      // Build where clause using existing helper methods from findAll
      const whereConditions = this.buildWhereConditionsForNoPagination(filters);
      
      // Build orderBy object using existing helper method from findAll
      const orderBy = this.buildOrderByClause(sort_by, sort_order);

      // Get data with sorting but without pagination
      this.logger.log(`Fetching all questions without pagination`);
      const questions = await this.fetchQuestionsWithoutPagination(whereConditions, orderBy);
      
      // Transform and filter the results
      return this.processQuestionsWithoutPagination(questions, instruction_medium_id);
    } catch (error) {
      this.logger.error('Failed to fetch questions without pagination:', error);
      throw new InternalServerErrorException('Failed to fetch questions without pagination');
    }
  }

  private logWithoutPaginationParams(filters: Omit<QuestionFilters, 'page' | 'page_size'>): void {
    const { instruction_medium_id, question_type_id, topic_id, chapter_id, translation_status } = filters;
    
    this.logger.log(`Question findAllWithoutPagination called with params: 
      - instruction_medium_id: ${instruction_medium_id} 
      - other filters: ${question_type_id}, ${topic_id}, ${chapter_id}
      - translation_status: ${translation_status}
    `);
  }

  private buildWhereConditionsForNoPagination(
    filters: Omit<QuestionFilters, 'page' | 'page_size'>
  ): Prisma.QuestionWhereInput {
    const { 
      question_type_id, 
      topic_id, 
      chapter_id, 
      board_question,
      instruction_medium_id,
      is_verified,
      translation_status,
      search
    } = filters;
    
    let where: Prisma.QuestionWhereInput = {};
    const andConditions: Array<Prisma.QuestionWhereInput> = [];
    
    this.addBasicFilterForNoPagination(where, question_type_id, 'question_type_id');
    this.addTopicFilterForNoPagination(where, topic_id);
    this.addChapterFilterForNoPagination(where, chapter_id);
    this.addBasicFilterForNoPagination(where, board_question, 'board_question');
    this.addMediumFiltersForNoPagination(where, instruction_medium_id, is_verified, translation_status);
    this.addSearchFilterForNoPagination(andConditions, search);
    
    if (andConditions.length > 0) {
      where = {
        ...where,
        AND: andConditions
      };
    }
    
    return where;
  }

  private addBasicFilterForNoPagination(where: any, value: any, fieldName: string): void {
    if (value !== undefined) {
      where[fieldName] = value;
    }
  }

  private addTopicFilterForNoPagination(where: any, topic_id: number | undefined): void {
    if (topic_id) {
      where.question_topics = {
        some: {
          topic_id: topic_id
        }
      };
    }
  }

  private addChapterFilterForNoPagination(where: any, chapter_id: number | undefined): void {
    if (chapter_id) {
      where.question_topics = {
        some: {
          topic: {
            chapter_id: chapter_id
          }
        }
      };
    }
  }

  private addMediumFiltersForNoPagination(
    where: any, 
    instruction_medium_id: number | undefined, 
    is_verified: boolean | undefined,
    translation_status: string | undefined
  ): void {
    if (instruction_medium_id === undefined && is_verified === undefined && translation_status === undefined) {
      return;
    }
    
    const mediumFilter: any = {};
    
    if (instruction_medium_id !== undefined) {
      mediumFilter.instruction_medium_id = instruction_medium_id;
    }
    
    if (is_verified !== undefined) {
      mediumFilter.is_verified = is_verified;
    }
    
    if (translation_status !== undefined) {
      mediumFilter.translation_status = translation_status;
    }
    
    where.question_texts = {
      some: {
        question_text_topics: {
          some: mediumFilter
        }
      }
    };
  }

  private addSearchFilterForNoPagination(
    andConditions: Array<Prisma.QuestionWhereInput>, 
    search: string | undefined
  ): void {
    if (search) {
      andConditions.push({
        question_texts: {
          some: {
            question_text: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        }
      });
    }
  }

  private async fetchQuestionsWithoutPagination(
    whereConditions: Prisma.QuestionWhereInput,
    orderBy: any
  ) {
    return this.prisma.question.findMany({
      where: whereConditions,
      orderBy,
      include: {
        question_type: true,
        question_topics: {
          include: {
            topic: {
              include: {
                chapter: true
              }
            },
            question_text_topics: {
              include: {
                instruction_medium: true,
                question_text: true
              }
            }
          }
        },
        question_texts: {
          include: {
            image: true,
            mcq_options: {
              include: {
                image: true
              }
            },
            match_pairs: {
              include: {
                left_image: true,
                right_image: true
              }
            }
          }
        }
      }
    });
  }

  private async processQuestionsWithoutPagination(questions: any[], instruction_medium_id: number | undefined) {
    // Transform questions to include presigned URLs
    const transformedQuestions = await this.transformQuestionResults(questions);
    
    // Filter out questions with empty question_texts arrays when filters are applied
    return this.filterEmptyQuestionTexts(transformedQuestions, instruction_medium_id);
  }

  private filterEmptyQuestionTexts(questions: any[], instruction_medium_id: number | undefined) {
    if (instruction_medium_id === undefined) {
      return questions;
    }
    
    return questions.filter(question => 
      question.question_texts && question.question_texts.length > 0
    );
  }

  async findUntranslatedQuestions(
    instruction_medium_id_param: number,
    filters: QuestionFilterDto
  ) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        page = 1,
        page_size = 10,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search,
        is_verified,
        translation_status
      } = filters;

      // Log diagnostic information
      this.logger.log(`findUntranslatedQuestions translation_status parameter: ${translation_status}`);
      
      // Find question IDs with no translations for the specified medium
      const questionIds = await this.findUntranslatedQuestionIds(
        instruction_medium_id_param, 
        { chapter_id, is_verified, translation_status }
      );
      
      if (questionIds.length === 0) {
        this.logger.warn(`No untranslated questions found for medium ${instruction_medium_id_param} - check if the medium exists and has questions`);
      }
      
      // Build where conditions for the main query
      const whereConditions = this.buildUntranslatedWhereConditions(
        questionIds, 
        { question_type_id, board_question, topic_id, chapter_id, search }
      );
      
      // Build order by clause
      const orderBy = this.buildOrderByClause(sort_by, sort_order);
      this.logger.log(`Sorting untranslated questions with: ${JSON.stringify(orderBy)}`);
      
      // Get pagination values
      const skip = (page - 1) * page_size;
      const take = page_size;
      
      // Count total matching the criteria
      const totalCount = await this.prisma.question.count({
        where: whereConditions
      });
      
      // Create where condition for question_text_topics
      const questionTextTopicsWhere = this.buildQuestionTextTopicsWhere(is_verified, translation_status);
      
      // Fetch questions with all required includes
      const questions = await this.fetchUntranslatedQuestions(
        whereConditions,
        orderBy,
        questionTextTopicsWhere,
        skip,
        take
      );
      
      // Process the results 
      const processedQuestions = await this.processUntranslatedQuestions(questions);
      
      return {
        data: processedQuestions,
        meta: {
          total_count: totalCount,
          page,
          page_size,
          total_pages: Math.ceil(totalCount / page_size)
        }
      };
    } catch (error) {
      this.logger.error('Error in findUntranslatedQuestions:', error);
      throw new InternalServerErrorException('Failed to retrieve untranslated questions');
    }
  }

  private async findUntranslatedQuestionIds(
    instruction_medium_id_param: number,
    filters: { chapter_id?: number, is_verified?: boolean, translation_status?: string }
  ): Promise<number[]> {
    const { chapter_id, is_verified, translation_status } = filters;
    
    // Build the raw query for untranslated questions
    const untranslatedQuestionIds = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT DISTINCT q.id
      FROM "Question" q
      WHERE NOT EXISTS (
        SELECT 1 
        FROM "Question_Text" qt 
        JOIN "Question_Text_Topic_Medium" qttm ON qt.id = qttm.question_text_id
        WHERE qt.question_id = q.id 
        AND qttm.instruction_medium_id = ${instruction_medium_id_param}
      )
      ${chapter_id ? 
        Prisma.sql`AND EXISTS (
          SELECT 1 FROM "Question_Topic" qt2
          JOIN "Topic" t ON qt2.topic_id = t.id
          WHERE qt2.question_id = q.id AND t.chapter_id = ${chapter_id}
        )` : 
        Prisma.sql``
      }
      ${is_verified === true ? 
        Prisma.sql`AND EXISTS (
          SELECT 1 
          FROM "Question_Text" qt3 
          JOIN "Question_Text_Topic_Medium" qttm3 ON qt3.id = qttm3.question_text_id
          WHERE qt3.question_id = q.id 
          AND qttm3.is_verified = true
        )` : 
        Prisma.sql``
      }
      ${translation_status ? 
        Prisma.sql`AND EXISTS (
          SELECT 1 
          FROM "Question_Text" qt4 
          JOIN "Question_Text_Topic_Medium" qttm4 ON qt4.id = qttm4.question_text_id
          WHERE qt4.question_id = q.id 
          AND qttm4.translation_status = ${translation_status}
        )` : 
        Prisma.sql``
      }
    `;
    
    // Extract just the IDs
    const questionIds = untranslatedQuestionIds.map(q => q.id);
    
    // Add diagnostic logging
    this.logger.log(`Found ${questionIds.length} questions with no translations at all for medium ${instruction_medium_id_param}`);
    
    return questionIds;
  }
  
  private buildUntranslatedWhereConditions(
    questionIds: number[],
    filters: { 
      question_type_id?: number,
      board_question?: boolean,
      topic_id?: number,
      chapter_id?: number,
      search?: string
    }
  ): any {
    const { question_type_id, board_question, topic_id, chapter_id, search } = filters;
    const whereConditions: any = {
      id: {
        in: questionIds
      }
    };
    
    // Add basic filters
    if (question_type_id !== undefined) {
      whereConditions.question_type_id = question_type_id;
    }
    
    if (board_question !== undefined) {
      whereConditions.board_question = board_question;
    }
    
    // Handle topic filter
    if (topic_id !== undefined) {
      whereConditions.question_topics = {
        some: {
          topic_id
        }
      };
    }
    
    // Add chapter filter if specified
    if (chapter_id !== undefined) {
      whereConditions.question_topics = {
        ...(whereConditions.question_topics || {}),
        some: {
          ...(whereConditions.question_topics?.some || {}),
          topic: {
            chapter_id
          }
        }
      };
    }
    
    // Search filter
    if (search) {
      whereConditions.question_texts = {
        ...(whereConditions.question_texts || {}),
        some: {
          question_text: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      };
    }
    
    return whereConditions;
  }
  
  private buildQuestionTextTopicsWhere(is_verified?: boolean, translation_status?: string): any {
    const questionTextTopicsWhere = {};
    
    if (is_verified !== undefined) {
      questionTextTopicsWhere['is_verified'] = is_verified;
    }
    
    if (translation_status !== undefined) {
      questionTextTopicsWhere['translation_status'] = translation_status;
    }
    
    return questionTextTopicsWhere;
  }
  
  private async fetchUntranslatedQuestions(
    whereConditions: any,
    orderBy: any,
    questionTextTopicsWhere: any,
    skip: number,
    take: number
  ) {
    return this.prisma.question.findMany({
      where: whereConditions,
      orderBy,
      skip,
      take,
      include: {
        question_type: {
          select: {
            id: true,
            type_name: true
          }
        },
        question_texts: {
          include: {
            image: true,
            mcq_options: {
              include: {
                image: true
              }
            },
            match_pairs: {
              include: {
                left_image: true,
                right_image: true
              }
            },
            question_text_topics: {
              where: Object.keys(questionTextTopicsWhere).length > 0 ? questionTextTopicsWhere : {},
              include: {
                instruction_medium: {
                  select: {
                    id: true,
                    instruction_medium: true
                  }
                },
                question_topic: {
                  include: {
                    topic: {
                      select: {
                        id: true,
                        name: true,
                        chapter_id: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                chapter_id: true
              }
            }
          }
        }
      }
    });
  }
  
  private async processUntranslatedQuestions(questions: any[]) {
    // Transform data to include presigned URLs for all images
    const transformedQuestions = await this.transformQuestionResults(questions);
  
    // Simplify the response structure for client consumption
    return transformedQuestions.map(question => {
      return {
        id: question.id,
        question_type_id: question.question_type_id,
        board_question: question.board_question,
        question_type: question.question_type,
        question_texts: this.processUntranslatedQuestionTexts(question.question_texts),
        question_topics: question.question_topics.map(qt => ({
          id: qt.id,
          topic: {
            id: qt.topic.id,
            name: qt.topic.name,
            chapter_id: qt.topic.chapter_id
          }
        }))
      };
    });
  }
  
  private processUntranslatedQuestionTexts(texts: any[]) {
    return texts.map(text => ({
      id: text.id,
      question_id: text.question_id,
      image_id: text.image_id,
      question_text: text.question_text,
      image: text.image, // Already has presigned_url from transformQuestionResults
      mcq_options: text.mcq_options || [], // Already have presigned_url from transformQuestionResults
      match_pairs: text.match_pairs || [], // Already have presigned_url from transformQuestionResults
      translation_status: text.question_text_topics && text.question_text_topics.length > 0 
        ? text.question_text_topics[0].translation_status
        : 'original',
      topic: text.question_text_topics && text.question_text_topics.length > 0 
        ? {
            id: text.question_text_topics[0].question_topic?.topic?.id,
            chapter_id: text.question_text_topics[0].question_topic?.topic?.chapter_id,
            name: text.question_text_topics[0].question_topic?.topic?.name
          }
        : null
    }));
  }

  // Create a complete question with all related data in a single transaction
  async createComplete(completeDto: CompleteQuestionDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Step 1: Validate all referenced entities
        await this.validateReferencedEntities(prisma, completeDto);

        // Step 2: Check for existing question text
        const existingQuestionText = await this.findExistingQuestionText(prisma, completeDto);
        
        // Step 3: Handle existing question text if found
        if (existingQuestionText) {
          return await this.handleExistingQuestionText(
            prisma, 
            existingQuestionText, 
            completeDto
          );
        }
        
        // Step 4: Create new question with all related data
        return await this.createNewQuestion(prisma, completeDto);
      });
    } catch (error) {
      this.handleCreateCompleteError(error);
    }
  }

  private handleCreateCompleteError(error: any): never {
    this.logger.error('Failed to create complete question:', error);
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to create complete question: ' + error.message);
  }

  private async validateReferencedEntities(prisma: any, completeDto: CompleteQuestionDto): Promise<void> {
    // Validate that required properties exist in the DTO
    if (!completeDto) {
      throw new BadRequestException('Question data is required');
    }
    
    const {
      question_type_id,
      question_topic_data,
      question_text_topic_medium_data,
      question_text_data
    } = completeDto;

    // Validate all required properties exist
    if (question_type_id === undefined) {
      throw new BadRequestException('question_type_id is required');
    }
    
    if (question_topic_data?.topic_id === undefined) {
      throw new BadRequestException('question_topic_data with topic_id is required');
    }
    
    if (!question_text_data) {
      throw new BadRequestException('question_text_data is required');
    }

    // Validate question type
    await this.validateQuestionType(prisma, question_type_id);
    
    // Validate topic
    await this.validateTopic(prisma, question_topic_data.topic_id);
    
    // Validate instruction medium if provided
    if (question_text_topic_medium_data) {
      await this.validateInstructionMedium(prisma, question_text_topic_medium_data.instruction_medium_id);
    }
    
    // Validate images
    await this.validateImages(prisma, question_text_data);
  }

  private async validateQuestionType(prisma: any, question_type_id: number): Promise<void> {
    const questionType = await prisma.question_Type.findUnique({
      where: { id: question_type_id }
    });
    
    if (!questionType) {
      throw new NotFoundException(`Question type with ID ${question_type_id} not found`);
    }
  }

  private async validateTopic(prisma: any, topic_id: number): Promise<void> {
    const topic = await prisma.topic.findUnique({
      where: { id: topic_id }
    });
    
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topic_id} not found`);
    }
  }

  private async validateInstructionMedium(prisma: any, instruction_medium_id: number): Promise<void> {
    const medium = await prisma.instruction_Medium.findUnique({
      where: { id: instruction_medium_id }
    });
    
    if (!medium) {
      throw new NotFoundException(`Instruction medium with ID ${instruction_medium_id} not found`);
    }
  }

  private async validateImages(prisma: any, question_text_data: any): Promise<void> {
    // Validate question text image
    await this.validateQuestionTextImage(prisma, question_text_data);
    
    // Validate MCQ option images
    await this.validateMcqOptionImages(prisma, question_text_data);
    
    // Validate match pair images
    await this.validateMatchPairImages(prisma, question_text_data);
  }

  private async validateQuestionTextImage(prisma: any, question_text_data: any): Promise<void> {
    if (question_text_data.image_id) {
      const image = await prisma.image.findUnique({
        where: { id: question_text_data.image_id }
      });
      
      if (!image) {
        throw new NotFoundException(`Image with ID ${question_text_data.image_id} not found`);
      }
    }
  }

  private async validateMcqOptionImages(prisma: any, question_text_data: any): Promise<void> {
    if (!question_text_data.mcq_options) return;

    for (const option of question_text_data.mcq_options) {
      if (option.image_id) {
        const image = await prisma.image.findUnique({
          where: { id: option.image_id }
        });
        
        if (!image) {
          throw new NotFoundException(`Image with ID ${option.image_id} for MCQ option not found`);
        }
      }
    }
  }

  private async validateMatchPairImages(prisma: any, question_text_data: any): Promise<void> {
    if (!question_text_data.match_pairs) return;

    for (const pair of question_text_data.match_pairs) {
      await this.validateSingleMatchPairImages(prisma, pair);
    }
  }

  private async validateSingleMatchPairImages(prisma: any, pair: any): Promise<void> {
    if (pair.left_image_id) {
      const leftImage = await prisma.image.findUnique({
        where: { id: pair.left_image_id }
      });
      
      if (!leftImage) {
        throw new NotFoundException(`Left image with ID ${pair.left_image_id} for match pair not found`);
      }
    }
    
    if (pair.right_image_id) {
      const rightImage = await prisma.image.findUnique({
        where: { id: pair.right_image_id }
      });
      
      if (!rightImage) {
        throw new NotFoundException(`Right image with ID ${pair.right_image_id} for match pair not found`);
      }
    }
  }

  private async findExistingQuestionText(prisma: any, completeDto: CompleteQuestionDto): Promise<any> {
    const { question_text_data, question_topic_data } = completeDto;
    
    this.logger.log(`Checking if question text "${question_text_data.question_text.substring(0, 50)}..." already exists`);
    
    return prisma.question_Text.findFirst({
      where: {
        question_text: question_text_data.question_text
      },
      include: {
        image: true,
        question: {
          include: {
            question_type: true,
            question_topics: {
              where: {
                topic_id: question_topic_data.topic_id
              },
              include: {
                topic: true
              }
            }
          }
        },
        question_text_topics: {
          where: {
            question_topic: {
              topic_id: question_topic_data.topic_id
            }
          },
          include: {
            instruction_medium: true
          }
        }
      }
    });
  }

  private async handleExistingQuestionText(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    this.logger.log(`Found existing question text with ID ${existingQuestionText.id}`);
    
    const { question_type_id, question_text_data } = completeDto;
    
    // Check if existingQuestionText.question exists before accessing its properties
    if (!existingQuestionText.question) {
      this.logger.warn(`No question data found for existing question text with ID ${existingQuestionText.id}`);
      return await this.createNewQuestion(prisma, completeDto);
    }
    
    // Check if question types are different
    if (existingQuestionText.question.question_type_id !== question_type_id) {
      this.logger.log(`Question types are different (existing: ${existingQuestionText.question.question_type_id}, new: ${question_type_id}). Creating a new question.`);
      // Skip to creating a new question as different question type means different question
      return await this.createNewQuestion(prisma, completeDto);
    }
    
    // Check for differences in images
    const imageSituation = this.checkImageSituation(existingQuestionText, question_text_data);
    
    if (imageSituation.isDifferent) {
      this.logger.log(imageSituation.message);
      return await this.createNewQuestion(prisma, completeDto);
    }
    
    // Handle identical question (same text, type, and image situation)
    return await this.handleIdenticalQuestion(prisma, existingQuestionText, completeDto);
  }

  private checkImageSituation(existingQuestionText: any, question_text_data: any): { isDifferent: boolean, message: string } {
    const existingHasImage = existingQuestionText.image_id !== null;
    const newHasImage = question_text_data.image_id !== null;
    
    // Case 1: Different image presence (one has image, other doesn't)
    if (existingHasImage !== newHasImage) {
      return {
        isDifferent: true,
        message: `Image presence differs (existing: ${existingHasImage ? 'has image' : 'no image'}, new: ${newHasImage ? 'has image' : 'no image'}). Will create a new question.`
      };
    }
    
    // Case 2: Both have images but they're different
    if (existingHasImage && newHasImage && existingQuestionText.image_id !== question_text_data.image_id) {
      return {
        isDifferent: true,
        message: `Both have images but they are different (existing: ${existingQuestionText.image_id}, new: ${question_text_data.image_id}). Will create a new question.`
      };
    }
    
    // Images are the same
    return { isDifferent: false, message: '' };
  }

  private async handleIdenticalQuestion(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    // Add defensive check for existingQuestionText
    if (!existingQuestionText?.question) {
      this.logger.warn('No existing question data found in handleIdenticalQuestion, proceeding with new question creation');
      return this.createNewQuestion(prisma, completeDto);
    }

    const {
      question_topic_data,
      question_text_topic_medium_data
    } = completeDto;

    // Check if the question is already associated with the given topic
    const existingTopicAssociation = await prisma.question_Topic.findFirst({
      where: {
        question_id: existingQuestionText.question_id,
        topic_id: question_topic_data.topic_id
      }
    });

    if (existingTopicAssociation) {
      this.logger.log(`Question ${existingQuestionText.question_id} is already associated with topic ${question_topic_data.topic_id}`);
      
      // Handle the case where the topic association already exists
      if (question_text_topic_medium_data) {
        return this.handleMediumForExistingTopic(prisma, existingQuestionText, completeDto);
      } else {
        // Just return the existing question if no medium association is requested
        return this.fetchCompleteQuestion(prisma, existingQuestionText.question_id);
      }
    } else {
      this.logger.log(`Question ${existingQuestionText.question_id} is not associated with topic ${question_topic_data.topic_id} yet`);
      
      // Handle the case where a new topic association is needed
      return this.handleNoExistingTopicAssociation(prisma, existingQuestionText, completeDto);
    }
  }

  private async handleExistingTopicAssociation(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    const { question_topic_data, question_text_topic_medium_data } = completeDto;
    
    this.logger.log(`Question ID ${existingQuestionText.question_id} is already associated with topic ID ${question_topic_data.topic_id}`);
    
    // Handle medium if specified
    if (question_text_topic_medium_data) {
      return await this.handleMediumForExistingTopic(
        prisma, 
        existingQuestionText, 
        completeDto
      );
    } else {
      // No medium specified but question already exists for this topic
      return {
        message: `Question with the same text already exists for topic "${existingQuestionText.question.question_topics[0].topic.name}"`,
        existing_question: await this.transformSingleQuestion(existingQuestionText.question),
        is_duplicate: true
      };
    }
  }

  private async handleMediumForExistingTopic(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    const { question_text_topic_medium_data } = completeDto;
    
    const existingMediumAssociation = existingQuestionText.question_text_topics.some(
      textTopic => textTopic.instruction_medium_id === question_text_topic_medium_data.instruction_medium_id
    );
    
    if (existingMediumAssociation) {
      // Question with same text already exists for this topic and medium
      return await this.handleExistingMediumAssociation(
        prisma, 
        existingQuestionText, 
        completeDto
      );
    } else {
      // Question exists for this topic but not for this medium - add the medium association
      return await this.addMediumToExistingTopicAssociation(
        prisma, 
        existingQuestionText, 
        completeDto
      );
    }
  }

  private async handleExistingMediumAssociation(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    // Add defensive check
    if (!existingQuestionText?.question) {
      this.logger.warn('No existing question data found in handleExistingMediumAssociation');
      return this.createNewQuestion(prisma, completeDto);
    }

    const { 
      question_topic_data,
      question_text_topic_medium_data 
    } = completeDto;

    // Find the existing topic association
    const existingQuestionTopic = await prisma.question_Topic.findFirst({
      where: {
        question_id: existingQuestionText.question_id,
        topic_id: question_topic_data.topic_id
      }
    });

    if (!existingQuestionTopic) {
      this.logger.warn(`Expected topic association not found for question ${existingQuestionText.question_id} and topic ${question_topic_data.topic_id}`);
      return this.createNewQuestion(prisma, completeDto);
    }

    // Check if this question text is already associated with the requested medium for this topic
    const existingMediumAssociation = await prisma.question_Text_Topic_Medium.findFirst({
      where: {
        question_text_id: existingQuestionText.id,
        question_topic_id: existingQuestionTopic.id,
        instruction_medium_id: question_text_topic_medium_data.instruction_medium_id
      }
    });

    if (existingMediumAssociation) {
      this.logger.log(`Text ${existingQuestionText.id} is already associated with medium ${question_text_topic_medium_data.instruction_medium_id} for topic ${existingQuestionTopic.id}`);
      
      // Just return the existing question since the association already exists
      return this.fetchCompleteQuestion(prisma, existingQuestionText.question_id);
    } else {
      this.logger.log(`Creating new medium association for text ${existingQuestionText.id} with medium ${question_text_topic_medium_data.instruction_medium_id}`);
      
      // Create the new medium association
      await this.createMediumAssociation(
        prisma, 
        existingQuestionText.id, 
        existingQuestionTopic.id, 
        question_text_topic_medium_data
      );
      
      // Return the updated question
      return this.fetchCompleteQuestion(prisma, existingQuestionText.question_id);
    }
  }

  private async addMediumToExistingTopicAssociation(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    // Add defensive check
    if (!existingQuestionText?.question) {
      this.logger.warn('Missing existingQuestionText in addMediumToExistingTopicAssociation');
      return this.createNewQuestion(prisma, completeDto);
    }

    const {
      question_topic_data,
      question_text_topic_medium_data
    } = completeDto;
    
    if (!question_topic_data || !question_text_topic_medium_data) {
      this.logger.warn('Missing required data in completeDto');
      return this.createNewQuestion(prisma, completeDto);
    }

    // Find the existing topic association
    const existingQuestionTopic = await prisma.question_Topic.findFirst({
      where: {
        question_id: existingQuestionText.question_id,
        topic_id: question_topic_data.topic_id
      }
    });
    
    if (!existingQuestionTopic) {
      this.logger.warn(`Expected topic association not found for question ${existingQuestionText.question_id} and topic ${question_topic_data.topic_id}`);
      return this.createNewQuestion(prisma, completeDto);
    }

    // Create the medium association
    await this.createMediumAssociation(
      prisma,
      existingQuestionText.id,
      existingQuestionTopic.id,
      question_text_topic_medium_data
    );
    
    // Return the updated question
    return this.fetchCompleteQuestion(prisma, existingQuestionText.question_id);
  }

  private async handleNoExistingTopicAssociation(
    prisma: any, 
    existingQuestionText: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    const { question_topic_data, question_text_topic_medium_data } = completeDto;
    
    this.logger.log(`Creating new topic association for existing question ${existingQuestionText.question_id}`);
    
    // Create question topic association
    const questionTopic = await prisma.question_Topic.create({
      data: {
        question_id: existingQuestionText.question_id,
        topic_id: question_topic_data.topic_id
      }
    });
    
    // Create medium association if specified
    if (question_text_topic_medium_data) {
      await this.createMediumAssociation(
        prisma,
        existingQuestionText.id,
        questionTopic.id,
        question_text_topic_medium_data
      );
    }
    
    // Return the updated question
    return this.fetchCompleteQuestion(prisma, existingQuestionText.question_id);
  }

  private async createMediumAssociation(
    prisma: any, 
    question_text_id: number, 
    question_topic_id: number, 
    question_text_topic_medium_data: any
  ): Promise<void> {
    if (!question_text_id || !question_topic_id || !question_text_topic_medium_data) {
      this.logger.warn('Missing required parameters for createMediumAssociation');
      return;
    }

    this.logger.log(`Creating medium association for text ${question_text_id} and topic ${question_topic_id}`);
    
    await prisma.question_Text_Topic_Medium.create({
      data: {
        question_text_id,
        question_topic_id,
        instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
        is_verified: false, // Default to unverified for new entries
        translation_status: question_text_topic_medium_data.translation_status || 'original' // Default to original
      }
    });
  }

  private async createNewQuestion(
    prisma: any, 
    completeDto: CompleteQuestionDto
  ): Promise<any> {
    // Extract data from DTO
    const {
      question_type_id,
      board_question,
      question_topic_data,
      question_text_topic_medium_data,
      question_text_data
    } = completeDto;

    try {
      // Create the base question
      this.logger.log(`Creating new question with type ${question_type_id}`);
      
      const question = await prisma.question.create({
        data: {
          question_type_id,
          board_question: board_question ?? false
        }
      });
      
      // Create the question topic association
      const questionTopic = await this.createQuestionTopic(
        prisma, 
        question.id, 
        question_topic_data.topic_id
      );
      
      // Create the question text
      const questionText = await this.createQuestionText(
        prisma, 
        question.id, 
        question_text_data
      );
      
      // Create MCQ options if provided
      await this.createMcqOptions(
        prisma, 
        questionText.id, 
        question_text_data.mcq_options
      );
      
      // Create match pairs if provided
      await this.createMatchPairs(
        prisma, 
        questionText.id, 
        question_text_data.match_pairs
      );
      
      // Create the question text topic medium association if provided
      if (question_text_topic_medium_data) {
        await this.createQuestionTextTopicMedium(
          prisma, 
          questionText.id, 
          questionTopic.id, 
          question_text_topic_medium_data
        );
      }
      
      // Get the complete question with all relations
      const result = await this.fetchCompleteQuestion(prisma, question.id);
      
      // Transform and return the result
      return await this.transformSingleQuestion(result);
    } catch (error) {
      this.handleCreateCompleteError(error);
    }
  }

  private async createQuestionTopic(
    prisma: any, 
    question_id: number, 
    topic_id: number
  ): Promise<any> {
    this.logger.log(`Creating question topic association for question ${question_id} with topic ${topic_id}`);
    
    return prisma.question_Topic.create({
      data: {
        question_id,
        topic_id
      }
    });
  }

  private async createQuestionText(
    prisma: any, 
    question_id: number, 
    question_text_data: any
  ): Promise<any> {
    this.logger.log(`Creating question text for question ${question_id}`);
    
    return prisma.question_Text.create({
      data: {
        question_id,
        question_text: question_text_data.question_text,
        ...(question_text_data.image_id ? { image_id: question_text_data.image_id } : {})
      }
    });
  }

  private async createMcqOptions(
    prisma: any, 
    question_text_id: number, 
    mcq_options: any[]
  ): Promise<void> {
    if (!mcq_options || mcq_options.length === 0) return;
    
    this.logger.log(`Creating ${mcq_options.length} MCQ options for question text ${question_text_id}`);
    
    await Promise.all(mcq_options.map(option => 
      prisma.mcq_Option.create({
        data: {
          question_text_id,
          option_text: option.option_text,
          is_correct: option.is_correct ?? false,
          ...(option.image_id ? { image_id: option.image_id } : {})
        }
      })
    ));
  }

  private async createMatchPairs(
    prisma: any, 
    question_text_id: number, 
    match_pairs: any[]
  ): Promise<void> {
    if (!match_pairs || match_pairs.length === 0) return;
    
    this.logger.log(`Creating ${match_pairs.length} match pairs for question text ${question_text_id}`);
    
    await Promise.all(match_pairs.map(pair => 
      prisma.match_Pair.create({
        data: {
          question_text_id,
          ...(pair.left_text ? { left_text: pair.left_text } : {}),
          ...(pair.right_text ? { right_text: pair.right_text } : {}),
          ...(pair.left_image_id ? { left_image_id: pair.left_image_id } : {}),
          ...(pair.right_image_id ? { right_image_id: pair.right_image_id } : {})
        }
      })
    ));
  }

  private async createQuestionTextTopicMedium(
    prisma: any, 
    question_text_id: number, 
    question_topic_id: number, 
    question_text_topic_medium_data: any
  ): Promise<void> {
    this.logger.log(`Creating question text topic medium association for question text ${question_text_id} and topic ${question_topic_id}`);
    
    await prisma.question_Text_Topic_Medium.create({
      data: {
        question_text_id,
        question_topic_id,
        instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
        is_verified: false, // Always set to false for new entries
        translation_status: question_text_topic_medium_data.translation_status || 'original' // Default to 'original' for new entries
      }
    });
  }

  private async fetchCompleteQuestion(prisma: any, question_id: number): Promise<any> {
    return prisma.question.findUnique({
      where: { id: question_id },
      include: {
        question_type: true,
        question_texts: {
          include: {
            image: true,
            mcq_options: {
              include: {
                image: true
              }
            },
            match_pairs: {
              include: {
                left_image: true,
                right_image: true
              }
            },
            question_text_topics: {
              include: {
                instruction_medium: true,
                question_topic: {
                  include: {
                    topic: true
                  }
                }
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: true
          }
        }
      }
    });
  }

  private formatFinalResult(filteredQuestions: any[], count: number): any {
    const formattedResult = filteredQuestions.map(question => {
      const questionTexts = question.question_texts || [];
      
      return {
        ...question,
        mcq_options: questionTexts.length > 0 && questionTexts[0]?.mcq_options
          ? questionTexts[0].mcq_options
          : [],
        match_pairs: questionTexts.length > 0 && questionTexts[0]?.match_pairs
          ? questionTexts[0].match_pairs
          : [],
        images: questionTexts.length > 0 && questionTexts[0]?.images
          ? questionTexts[0].images
          : [],
      };
    });

    return {
      data: formattedResult,
      count,
    };
  }

  async updateComplete(id: number, editDto: EditCompleteQuestionDto) {
    const { board_question, question_text_id, question_text_data, question_topic_data } = editDto;

    this.logger.log(`Updating complete question with ID ${id} and question text ID ${question_text_id}`);
    
    /**
     * Image Comparison Strategy:
     * 
     * When updating questions, we need to check if a question with the same text already exists:
     * - If yes, we may be able to reuse that text to reduce database redundancy
     * - However, if the image situations differ (one has image vs. doesn't have, or different images),
     *   we need to create a new question text entry instead of reusing the existing one
     * 
     * This ensures that questions with the same text but different visual content
     * are treated as separate entities, which is important for educational purposes.
     * 
     * The comparison follows the same approach as in createComplete:
     * - Comparing image presence (has image vs. doesn't have image)
     * - Comparing image_ids when both questions have images
     */
    
    // We'll execute all operations in a transaction to ensure data consistency
    return await this.prisma.$transaction(async (prisma) => {
      // Validate entities and find existing question and text
      const { question, questionText, isOriginalText } = await this.validateAndFindExistingEntities(prisma, id, question_text_id);
      
      // Validate dependencies (question type, topic, image)
      await this.validateDependentEntities(prisma, question, question_text_data, question_topic_data);
      
      // Find and unverify related translations if this is the original text
      const relatedTranslationIds = isOriginalText ? 
        await this.unverifyRelatedTranslations(prisma, questionText, question_text_id) : [];
      
      // Update the question board status
      await this.updateQuestionBoardStatus(prisma, id, board_question);
      
      // Update the topic association
      await this.updateTopicAssociation(prisma, id, question_topic_data.topic_id);
      
      // Update the question text content
      await this.updateQuestionTextContent(prisma, question_text_id, question_text_data);
      
      // Handle MCQ options if present
      if (question_text_data.mcq_options) {
        await this.updateMcqOptions(prisma, question_text_id, question_text_data.mcq_options);
      }
      
      // Handle match pairs if present
      if (question_text_data.match_pairs) {
        await this.updateMatchPairs(prisma, question_text_id, question_text_data.match_pairs);
      }
      
      // Mark question text as unverified since it was updated
      await this.markQuestionTextAsUnverified(prisma, question_text_id);
      
      // Fetch and return the complete updated question
      const result = await this.fetchAndFormatUpdatedQuestion(
        prisma, 
        id, 
        question_text_id, 
        isOriginalText, 
        relatedTranslationIds
      );
      
      return result;
    });
  }
  
  private async validateAndFindExistingEntities(prisma: any, questionId: number, textId: number) {
    // 1. Validate that the question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        question_texts: true,
        question_topics: true
      }
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 1.1 Validate that the specified question text exists and belongs to this question
    const questionText = await prisma.question_Text.findFirst({
      where: { 
        id: textId,
        question_id: questionId
      },
      include: {
        question_text_topics: {
          include: {
            instruction_medium: true
          }
        }
      }
    });

    if (!questionText) {
      throw new NotFoundException(`Question text with ID ${textId} not found for question ${questionId}`);
    }

    // Determine if this is the original text (with translation_status = "original")
    const isOriginalText = questionText.question_text_topics.some(
      qtt => qtt.translation_status === 'original'
    );
    
    return { question, questionText, isOriginalText };
  }
  
  private async validateDependentEntities(
    prisma: any, 
    question: any, 
    questionTextData: any,
    questionTopicData: any
  ) {
    // 2. Check if the question type allows MCQ options or match pairs
    const questionType = await prisma.question_Type.findUnique({
      where: { id: question.question_type_id }
    });

    if (!questionType) {
      throw new NotFoundException(`Question type with ID ${question.question_type_id} not found`);
    }

    // 2.1 Validate topic
    const topic = await prisma.topic.findUnique({
      where: { id: questionTopicData.topic_id }
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${questionTopicData.topic_id} not found`);
    }

    // 2.2 Check image if provided for question text
    if (questionTextData.image_id) {
      const image = await prisma.image.findUnique({
        where: { id: questionTextData.image_id }
      });
      if (!image) {
        throw new NotFoundException(`Image with ID ${questionTextData.image_id} not found`);
      }
    }
  }
  
  private async unverifyRelatedTranslations(prisma: any, questionText: any, originalTextId: number) {
    this.logger.log(`Editing original text with ID ${originalTextId}. Will unverify all related translations.`);
    
    // Get the question_topic_ids associated with this text
    const questionTopicIds = questionText.question_text_topics.map(qtt => qtt.question_topic_id);
    
    // Find all text-topic-medium relations that:
    // 1. Have the same question_topic_id as the original text
    // 2. Are for different question_texts (translations)
    // 3. Have translation_status === 'translated'
    // 4. Are verified (is_verified === true)
    const relatedTranslations = await prisma.question_Text_Topic_Medium.findMany({
      where: {
        question_topic_id: { in: questionTopicIds },
        question_text_id: { not: originalTextId }, // Different from the original text
        translation_status: 'translated', // Is a translation
        is_verified: true // Is currently verified
      },
      include: {
        question_text: true,
        instruction_medium: true
      }
    });
    
    const relatedTranslationIds = relatedTranslations.map(rt => rt.id);
    
    if (relatedTranslationIds.length > 0) {
      this.logger.log(`Found ${relatedTranslationIds.length} related translations that will be unverified.`);
      
      // Log details of translations being unverified
      for (const rt of relatedTranslations) {
        this.logger.log(`Unverifying translation in ${rt.instruction_medium.instruction_medium} (text ID: ${rt.question_text_id})`);
      }
      
      // Unverify all related translations
      await prisma.question_Text_Topic_Medium.updateMany({
        where: {
          id: { in: relatedTranslationIds }
        },
        data: {
          is_verified: false
        }
      });
    } else {
      this.logger.log(`No related translations found that need to be unverified.`);
    }
    
    return relatedTranslationIds;
  }
  
  private async updateQuestionBoardStatus(prisma: any, questionId: number, boardQuestion: boolean) {
    // 3. Update the question board status
    await prisma.question.update({
      where: { id: questionId },
      data: { board_question: boardQuestion }
    });
  }
  
  private async updateTopicAssociation(prisma: any, questionId: number, topicId: number) {
    // 4. Update the topic association
    // First, find the existing topic association
    const existingTopic = await prisma.question_Topic.findFirst({
      where: { question_id: questionId }
    });

    if (existingTopic) {
      // Update existing topic association
      await prisma.question_Topic.update({
        where: { id: existingTopic.id },
        data: { topic_id: topicId }
      });
    } else {
      // Create new topic association if doesn't exist (shouldn't happen in normal flow)
      await prisma.question_Topic.create({
        data: {
          question_id: questionId,
          topic_id: topicId
        }
      });
    }
  }
  
  private async updateQuestionTextContent(prisma: any, textId: number, questionTextData: any) {
    // 5. Update the specified question text
    await prisma.question_Text.update({
      where: { id: textId },
      data: {
        question_text: questionTextData.question_text,
        image_id: questionTextData.image_id
      }
    });
  }
  
  private async updateMcqOptions(prisma: any, textId: number, mcqOptions: any[]) {
    // Get existing MCQ options
    const existingOptions = await prisma.mcq_Option.findMany({
      where: { question_text_id: textId }
    });

    // Create a map for easier lookup
    const existingOptionsMap = new Map(existingOptions.map(opt => [opt.id, opt]));
    
    // Keep track of processed options to identify which ones to delete
    const processedOptionIds = new Set();

    // Process each MCQ option
    for (const option of mcqOptions) {
      if (option.id) {
        // Update existing option
        if (existingOptionsMap.has(option.id)) {
          await prisma.mcq_Option.update({
            where: { id: option.id },
            data: {
              option_text: option.option_text,
              is_correct: option.is_correct,
              image_id: option.image_id
            }
          });
          processedOptionIds.add(option.id);
        }
      } else {
        // Create new option
        await prisma.mcq_Option.create({
          data: {
            question_text_id: textId,
            option_text: option.option_text,
            is_correct: option.is_correct ?? false,
            image_id: option.image_id
          }
        });
      }
    }

    // Delete options that weren't included in the update
    const optionsToDelete = existingOptions
      .filter(opt => !processedOptionIds.has(opt.id))
      .map(opt => opt.id);
      
    if (optionsToDelete.length > 0) {
      await prisma.mcq_Option.deleteMany({
        where: { id: { in: optionsToDelete } }
      });
    }
  }
  
  private async updateMatchPairs(prisma: any, textId: number, matchPairs: any[]) {
    // Get existing match pairs
    const existingPairs = await prisma.match_Pair.findMany({
      where: { question_text_id: textId }
    });

    // Create a map for easier lookup
    const existingPairsMap = new Map(existingPairs.map(pair => [pair.id, pair]));
    
    // Keep track of processed pairs to identify which ones to delete
    const processedPairIds = new Set();

    // Process each match pair
    for (const pair of matchPairs) {
      if (pair.id) {
        // Update existing pair
        if (existingPairsMap.has(pair.id)) {
          await prisma.match_Pair.update({
            where: { id: pair.id },
            data: {
              left_text: pair.left_text,
              right_text: pair.right_text,
              left_image_id: pair.left_image_id,
              right_image_id: pair.right_image_id
            }
          });
          processedPairIds.add(pair.id);
        }
      } else {
        // Create new pair
        await prisma.match_Pair.create({
          data: {
            question_text_id: textId,
            left_text: pair.left_text,
            right_text: pair.right_text,
            left_image_id: pair.left_image_id,
            right_image_id: pair.right_image_id
          }
        });
      }
    }

    // Delete pairs that weren't included in the update
    const pairsToDelete = existingPairs
      .filter(pair => !processedPairIds.has(pair.id))
      .map(pair => pair.id);
      
    if (pairsToDelete.length > 0) {
      await prisma.match_Pair.deleteMany({
        where: { id: { in: pairsToDelete } }
      });
    }
  }
  
  private async markQuestionTextAsUnverified(prisma: any, textId: number) {
    // 8. Update verification status to false in Question_Text_Topic_Medium
    await prisma.question_Text_Topic_Medium.updateMany({
      where: { question_text_id: textId },
      data: { is_verified: false }
    });
  }
  
  private async fetchAndFormatUpdatedQuestion(
    prisma: any, 
    questionId: number, 
    textId: number, 
    isOriginalText: boolean, 
    relatedTranslationIds: number[]
  ) {
    // 9. Return the updated question with all related data
    const updatedQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        question_type: true,
        question_texts: {
          where: { id: textId },
          include: {
            image: true,
            mcq_options: {
              include: {
                image: true
              }
            },
            match_pairs: {
              include: {
                left_image: true,
                right_image: true
              }
            },
            question_text_topics: {
              include: {
                instruction_medium: true,
                question_topic: {
                  include: {
                    topic: true
                  }
                }
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: true
          }
        }
      }
    });
    
    // Transform the result to include presigned URLs
    const transformedQuestion = await this.transformSingleQuestion(updatedQuestion);
    
    // Add information about unverified translations if applicable
    if (isOriginalText && relatedTranslationIds.length > 0) {
      this.logger.log(`Updated original text and unverified ${relatedTranslationIds.length} related translations`);
      return {
        ...transformedQuestion,
        translations_unverified: relatedTranslationIds.length,
        message: `Question updated successfully. ${relatedTranslationIds.length} related translations were unverified.`
      };
    }
    
    return transformedQuestion;
  }

  async removeFromChapter(id: number, removeDto: RemoveQuestionFromChapterDto) {
    const { topic_id, instruction_medium_id } = removeDto;
    
    const mediumText = instruction_medium_id ? 
      ` with instruction medium ID ${instruction_medium_id}` : 
      ' (all mediums)';
    
    this.logger.log(`Removing question ID ${id} from topic ID ${topic_id}${mediumText}`);
    
    return await this.prisma.$transaction(async (prisma) => {
      // Validate entities
      const { question, questionTopic, questionTexts } = await this.validateRemoveEntities(
        prisma, id, topic_id
      );
      
      // Delete associations and get results
      const deletedAssociations = await this.deleteTextTopicMediumAssociations(
        prisma, questionTexts, questionTopic.id, instruction_medium_id
      );
      
      // Check remaining associations
      const remainingAssociations = await this.countRemainingAssociations(
        prisma, questionTopic.id
      );
      
      // Determine if we should delete the question_topic
      const shouldDeleteQuestionTopic = instruction_medium_id === undefined || remainingAssociations === 0;
      
      if (shouldDeleteQuestionTopic) {
        return await this.handleQuestionTopicDeletion(
          prisma, id, topic_id, questionTopic.id, question, deletedAssociations
        );
      } else {
        // Just partial removal (medium associations only)
        return this.createPartialRemovalResponse(topic_id, deletedAssociations, remainingAssociations);
      }
    });
  }
  
  private async validateRemoveEntities(prisma: any, questionId: number, topicId: number) {
    // 1. Validate that the question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        question_topics: true,
        question_texts: {
          include: {
            image: true,
            mcq_options: {
              include: {
                image: true
              }
            },
            match_pairs: {
              include: {
                left_image: true,
                right_image: true
              }
            }
          }
        }
      }
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // 2. Find the specific question_topic record for this topic
    const questionTopic = await prisma.question_Topic.findFirst({
      where: {
        question_id: questionId,
        topic_id: topicId
      }
    });

    if (!questionTopic) {
      throw new NotFoundException(`Question with ID ${questionId} is not associated with topic ID ${topicId}`);
    }

    // 3. Find all question_text records for this question
    const questionTexts = await prisma.question_Text.findMany({
      where: { question_id: questionId }
    });

    if (!questionTexts || questionTexts.length === 0) {
      throw new NotFoundException(`No question texts found for question ID ${questionId}`);
    }
    
    return { question, questionTopic, questionTexts };
  }
  
  private async deleteTextTopicMediumAssociations(
    prisma: any, 
    questionTexts: any[], 
    questionTopicId: number, 
    instructionMediumId?: number
  ) {
    const deletedAssociations = [];
    
    for (const questionText of questionTexts) {
      // Create the where condition based on whether instruction_medium_id is provided
      const whereCondition: Prisma.Question_Text_Topic_MediumWhereInput = {
        question_text_id: questionText.id,
        question_topic_id: questionTopicId,
      };
      
      // Only add instruction_medium_id to the condition if it's provided
      if (instructionMediumId !== undefined) {
        whereCondition.instruction_medium_id = instructionMediumId;
      }
      
      // Get the associations before deletion for reporting
      const associations = await prisma.question_Text_Topic_Medium.findMany({
        where: whereCondition,
        include: {
          instruction_medium: true
        }
      });
      
      deletedAssociations.push(...associations.map(a => a.instruction_medium_id.toString()));
      
      // Delete the associations
      await prisma.question_Text_Topic_Medium.deleteMany({
        where: whereCondition
      });
    }
    
    return deletedAssociations;
  }
  
  private async countRemainingAssociations(prisma: any, questionTopicId: number) {
    // Check if there are any remaining question_text_topic_medium records for this question_topic
    return await prisma.question_Text_Topic_Medium.count({
      where: {
        question_topic_id: questionTopicId
      }
    });
  }
  
  private async handleQuestionTopicDeletion(
    prisma: any, 
    questionId: number, 
    topicId: number, 
    questionTopicId: number, 
    question: any, 
    deletedAssociations: string[]
  ) {
    // 6. Check if this is the last question_topic for this question
    const remainingTopics = await prisma.question_Topic.count({
      where: {
        question_id: questionId,
        NOT: {
          id: questionTopicId // Exclude the current topic
        }
      }
    });

    // 7. If it's the last topic, delete the entire question
    if (remainingTopics === 0) {
      return await this.deleteEntireQuestion(prisma, questionId, question, deletedAssociations);
    } else {
      // 8. If it's not the last topic, just delete this question_topic
      await prisma.question_Topic.delete({
        where: { id: questionTopicId }
      });

      return {
        message: `Question ID ${questionId} completely removed from topic ID ${topicId}`,
        removed_from_chapter: true,
        topic_association_deleted: true,
        question_deleted: false,
        remaining_topic_count: remainingTopics,
        mediums_removed: deletedAssociations
      };
    }
  }
  
  private async deleteEntireQuestion(
    prisma: any, 
    questionId: number, 
    question: any, 
    deletedAssociations: string[]
  ) {
    this.logger.log(`This is the last topic for question ID ${questionId}. Deleting the entire question.`);
    
    // Collect all images that need to be deleted from S3
    const imagesToDelete = await this.collectImagesToDelete(question);
    
    // Delete the question (will cascade delete all related records)
    await prisma.question.delete({
      where: { id: questionId }
    });
    
    // After the database transaction succeeds, delete the images from S3
    await this.deleteImagesFromS3(questionId, imagesToDelete);
    
    return {
      message: `Question ID ${questionId} completely deleted as this was the last topic association`,
      removed_from_chapter: true,
      question_deleted: true,
      mediums_removed: deletedAssociations,
      images_deleted: imagesToDelete.length
    };
  }
  
  private async deleteImagesFromS3(questionId: number, imagesToDelete: string[]) {
    if (imagesToDelete.length === 0) {
      return;
    }
    
    this.logger.log(`Deleting ${imagesToDelete.length} images from S3 bucket for question ${questionId}`);
    try {
      await Promise.all(imagesToDelete.map(async (imageUrl) => {
        await this.awsS3Service.deleteFile(imageUrl);
      }));
      this.logger.log(`Successfully deleted ${imagesToDelete.length} images from S3 for question ${questionId}`);
    } catch (error) {
      this.logger.error(`Error deleting images from S3 for question ${questionId}:`, error);
      // We continue even if image deletion fails since the database records are already deleted
    }
  }
  
  private createPartialRemovalResponse(topicId: number, deletedAssociations: string[], remainingAssociations: number) {
    // 9. If we only deleted specific medium associations but the topic still has others
    return {
      message: `Question ID ${topicId} partially removed from topic ID ${topicId}`,
      removed_from_chapter: true,
      topic_association_deleted: false,
      medium_associations_deleted: true,
      question_deleted: false,
      mediums_removed: deletedAssociations,
      remaining_medium_associations: remainingAssociations
    };
  }

  // Helper method to collect all image URLs for a question that should be deleted
  private async collectImagesToDelete(question): Promise<string[]> {
    // Step 1: Collect all image URLs from the question
    const imageUrls = this.collectImageUrlsFromQuestion(question);
    
    // Step 2: Filter for images that are safe to delete (not used elsewhere)
    const safeToDelete = await this.filterSafeToDeleteImages(question, imageUrls);
    
    this.logger.log(`Found ${safeToDelete.length} images that can be safely deleted for question ${question.id}`);
    return safeToDelete;
  }
  
  private collectImageUrlsFromQuestion(question): Set<string> {
    const imageUrls = new Set<string>();
    
    for (const questionText of question.question_texts) {
      // Add main question text image
      this.addImageUrlIfExists(imageUrls, questionText.image);
      
      // Add MCQ option images
      this.addMcqOptionImageUrls(imageUrls, questionText.mcq_options);
      
      // Add match pair images
      this.addMatchPairImageUrls(imageUrls, questionText.match_pairs);
    }
    
    return imageUrls;
  }
  
  private addImageUrlIfExists(imageUrls: Set<string>, image: any): void {
    if (image?.image_url) {
      imageUrls.add(image.image_url);
    }
  }
  
  private addMcqOptionImageUrls(imageUrls: Set<string>, options: any[]): void {
    if (!options) return;
    
    for (const option of options) {
      this.addImageUrlIfExists(imageUrls, option.image);
    }
  }
  
  private addMatchPairImageUrls(imageUrls: Set<string>, pairs: any[]): void {
    if (!pairs) return;
    
    for (const pair of pairs) {
      this.addImageUrlIfExists(imageUrls, pair.left_image);
      this.addImageUrlIfExists(imageUrls, pair.right_image);
    }
  }
  
  private async filterSafeToDeleteImages(question: any, imageUrls: Set<string>): Promise<string[]> {
    const imageUrlsArray = Array.from(imageUrls);
    const safeToDelete: string[] = [];
    
    for (const imageUrl of imageUrlsArray) {
      const imageId = this.findImageIdByUrl(question, imageUrl);
      if (!imageId) continue;
      
      const isUsedElsewhere = await this.isImageUsedByOtherQuestions(imageId, question.id);
      if (!isUsedElsewhere) {
        safeToDelete.push(imageUrl);
      }
    }
    
    return safeToDelete;
  }
  
  private findImageIdByUrl(question: any, imageUrl: string): number | null {
    for (const questionText of question.question_texts) {
      // Check main image
      if (this.doesImageMatch(questionText.image, imageUrl)) {
        return questionText.image.id;
      }
      
      // Check MCQ option images
      const mcqImageId = this.findMcqImageIdByUrl(questionText.mcq_options, imageUrl);
      if (mcqImageId) return mcqImageId;
      
      // Check match pair images
      const matchPairImageId = this.findMatchPairImageIdByUrl(questionText.match_pairs, imageUrl);
      if (matchPairImageId) return matchPairImageId;
    }
    
    return null;
  }
  
  private doesImageMatch(image: any, imageUrl: string): boolean {
    return image?.image_url === imageUrl;
  }
  
  private findMcqImageIdByUrl(options: any[], imageUrl: string): number | null {
    if (!options) return null;
    
    for (const option of options) {
      if (this.doesImageMatch(option.image, imageUrl)) {
        return option.image.id;
      }
    }
    
    return null;
  }
  
  private findMatchPairImageIdByUrl(pairs: any[], imageUrl: string): number | null {
    if (!pairs) return null;
    
    for (const pair of pairs) {
      if (this.doesImageMatch(pair.left_image, imageUrl)) {
        return pair.left_image.id;
      }
      
      if (this.doesImageMatch(pair.right_image, imageUrl)) {
        return pair.right_image.id;
      }
    }
    
    return null;
  }
  
  private async isImageUsedByOtherQuestions(imageId: number, questionId: number): Promise<boolean> {
    const usageCount = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT image_id FROM "Question_Text" WHERE image_id = ${imageId} AND question_id != ${questionId}
        UNION ALL
        SELECT image_id FROM "Mcq_Option" WHERE image_id = ${imageId} AND question_text_id NOT IN (
          SELECT id FROM "Question_Text" WHERE question_id = ${questionId}
        )
        UNION ALL
        SELECT left_image_id FROM "Match_Pair" WHERE left_image_id = ${imageId} AND question_text_id NOT IN (
          SELECT id FROM "Question_Text" WHERE question_id = ${questionId}
        )
        UNION ALL
        SELECT right_image_id FROM "Match_Pair" WHERE right_image_id = ${imageId} AND question_text_id NOT IN (
          SELECT id FROM "Question_Text" WHERE question_id = ${questionId}
        )
      ) as usage
    `;
    
    return usageCount[0].count > 0;
  }

  // Simplify questions for API response
  private simplifyQuestionData(questions) {
    if (!Array.isArray(questions)) {
      return this.simplifyQuestionItem(questions);
    }
    
    return questions.map(question => this.simplifyQuestionItem(question));
  }
  
  // Simplify a question object to include only essential fields
  private simplifyQuestionItem(question) {
    if (!question) return null;
    
    this.logQuestionDebugInfo(question);
    
    // Get the default topic from question_topics as a fallback
    const defaultTopic = this.extractDefaultTopic(question);
    
    // Simplified question object with only required fields
    return {
      id: question.id,
      board_question: question.board_question,
      question_type_id: question.question_type?.id,
      question_type: this.simplifyQuestionType(question.question_type),
      question_texts: this.simplifyQuestionTexts(question, defaultTopic)
    };
  }
  
  private logQuestionDebugInfo(question) {
    const hasQuestionTopics = question.question_topics && question.question_topics.length > 0;
    const questionTextsLength = question.question_texts?.length || 0;
    const hasTopicInFirstText = question.question_texts?.[0]?.topic;
    const firstTextTopicData = hasTopicInFirstText 
                             ? JSON.stringify(question.question_texts[0].topic) 
                             : 'none';
    
    this.logger.log(`simplifyQuestionItem processing question ${question.id}:
      - Has question_topics: ${hasQuestionTopics ? 'yes' : 'no'}
      - Number of question_texts: ${questionTextsLength}
      - Text 0 has topic?: ${hasTopicInFirstText ? 'yes' : 'no'}
      - Text 0 topic data: ${firstTextTopicData}
    `);
  }
  
  private extractDefaultTopic(question) {
    const hasValidTopic = question.question_topics && 
                         question.question_topics.length > 0 && 
                         question.question_topics[0].topic;
                         
    if (!hasValidTopic) return null;
    
    const topicSource = question.question_topics[0].topic;
    return {
      id: topicSource.id,
      name: topicSource.name,
      chapter_id: topicSource.chapter_id
    };
  }
  
  private simplifyQuestionType(questionType) {
    if (!questionType) return null;
    
    return {
      id: questionType.id,
      type_name: questionType.type_name
    };
  }
  
  private simplifyQuestionTexts(question, defaultTopic) {
    return (question.question_texts || []).map(text => 
      this.simplifyQuestionText(text, question.id, defaultTopic)
    );
  }
  
  private simplifyQuestionText(text, questionId, defaultTopic) {
    // Determine the final topic for this text
    const finalTopic = this.determineFinalTopic(text, questionId, defaultTopic);
    
    // Create the base text object
    const textObj = this.createBaseTextObject(text, finalTopic);
    
    // Add translation status
    this.addTranslationStatus(textObj, text);
    
    return textObj;
  }
  
  private determineFinalTopic(text, questionId, defaultTopic) {
    // First try to use the topic already set on the text
    if (text.topic) return text.topic;
    
    // If no topic set but we have a default, use it and log
    if (defaultTopic) {
      this.logger.log(`simplifyQuestionItem: Using default topic for question ${questionId}, text ${text.id}`);
      return defaultTopic;
    }
    
    // As a last resort, try to get from question_text_topics
    return this.extractTopicFromTextTopics(text, questionId);
  }
  
  private extractTopicFromTextTopics(text, questionId) {
    const hasValidTextTopic = text.question_text_topics && 
                            text.question_text_topics.length > 0 && 
                            text.question_text_topics[0].question_topic?.topic;
                            
    if (!hasValidTextTopic) return null;
    
    const topicData = text.question_text_topics[0].question_topic.topic;
    const extractedTopic = {
      id: topicData.id,
      name: topicData.name,
      chapter_id: topicData.chapter_id
    };
    
    this.logger.log(`simplifyQuestionItem: Found topic in text_topics for question ${questionId}, text ${text.id}`);
    return extractedTopic;
  }
  
  private createBaseTextObject(text, finalTopic) {
    return {
      id: text.id,
      question_id: text.question_id,
      image_id: text.image_id,
      question_text: text.question_text,
      image: text.image,
      mcq_options: text.mcq_options || [],
      match_pairs: text.match_pairs || [],
      topic: finalTopic
    };
  }
  
  private addTranslationStatus(textObj, text) {
    const hasTextTopics = text.question_text_topics && text.question_text_topics.length > 0;
    
    if (hasTextTopics) {
      textObj.translation_status = text.question_text_topics[0].translation_status || 'original';
    } else {
      textObj.translation_status = 'original';
    }
  }

  /**
   * Add a translation for an existing question
   * @param questionId The ID of the question to translate
   * @param translationDto The translation data
   * @returns The created translation details
   */
  async addTranslation(questionId: number, translationDto: AddTranslationDto) {
    // Step 1: Get and validate the question
    const question = await this.getQuestionForTranslation(questionId);
    
    // Step 2: Perform validation checks
    await this.validateTranslationRequest(question, translationDto, questionId);
    
    // Step 3: Create the translation in a transaction
    return await this.createTranslation(questionId, translationDto, question.question_type);
  }
  
  private async getQuestionForTranslation(questionId: number) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        question_type: true,
        question_texts: {
          include: {
            image: true,
            mcq_options: true,
            match_pairs: true,
            question_text_topics: {
              include: {
                question_topic: {
                  include: {
                    topic: true
                  }
                },
                instruction_medium: true
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: true
          }
        }
      }
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    
    return question;
  }
  
  private async validateTranslationRequest(question: any, translationDto: AddTranslationDto, questionId: number) {
    this.validateVerifiedTextExists(question, questionId);
    this.validateNoExistingTranslation(question, translationDto, questionId);
    this.validateImageConsistency(question, translationDto);
    this.validateContentByQuestionType(question.question_type, translationDto);
  }
  
  private validateVerifiedTextExists(question: any, questionId: number) {
    const hasVerifiedText = question.question_texts.some(text => 
      text.question_text_topics?.some(qttm => qttm.is_verified)
    );

    if (!hasVerifiedText) {
      throw new BadRequestException(
        `Question with ID ${questionId} does not have any verified text. Only verified questions can be translated.`
      );
    }
  }
  
  private validateNoExistingTranslation(question: any, translationDto: AddTranslationDto, questionId: number) {
    const existingTranslation = question.question_texts.some(text => 
      text.question_text_topics?.some(
        qttm => qttm.instruction_medium_id === translationDto.instruction_medium_id
      )
    );

    if (existingTranslation) {
      throw new ConflictException(
        `Translation for question ID ${questionId} in medium ID ${translationDto.instruction_medium_id} already exists`
      );
    }
  }
  
  private validateImageConsistency(question: any, translationDto: AddTranslationDto) {
    const sourceHasImage = question.question_texts.some(text => text.image_id !== null);
    const translationHasImage = translationDto.image_id !== undefined && translationDto.image_id !== null;

    if (sourceHasImage && !translationHasImage) {
      throw new BadRequestException(
        'Original question has an image, but translation does not include an image_id. Please provide an image for consistency.'
      );
    }

    if (!sourceHasImage && translationHasImage) {
      throw new BadRequestException(
        'Original question does not have an image, but translation includes an image_id. Please remove the image_id for consistency.'
      );
    }
  }
  
  private validateContentByQuestionType(questionType: any, translationDto: AddTranslationDto) {
    const typeName = questionType.type_name.toLowerCase();
    
    // For MCQ questions, ensure mcq_options are provided
    if (typeName.includes('multiple choice') && this.isMissingOptions(translationDto.mcq_options)) {
      throw new BadRequestException('MCQ options must be provided for Multiple Choice question types');
    }

    // For matching questions, ensure match_pairs are provided
    if (typeName.includes('match') && this.isMissingOptions(translationDto.match_pairs)) {
      throw new BadRequestException('Match pairs must be provided for Matching question types');
    }
  }
  
  private isMissingOptions(options: any[] | undefined): boolean {
    return !options || options.length === 0;
  }
  
  private async createTranslation(questionId: number, translationDto: AddTranslationDto, questionType: any) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the question text
      const newQuestionText = await this.createTranslationQuestionText(prisma, questionId, translationDto);
      
      // 2. Create options based on question type
      await this.createQuestionOptions(prisma, newQuestionText.id, translationDto, questionType);
      
      // 3. Create topic-medium associations
      await this.createTopicMediumAssociations(prisma, questionId, newQuestionText.id, translationDto);
      
      // 4. Generate response
      return this.formatTranslationResponse(prisma, questionId, newQuestionText, translationDto);
    });
  }
  
  private async createQuestionOptions(prisma: any, textId: number, translationDto: AddTranslationDto, questionType: any) {
    // Create MCQ options if needed
    if (translationDto.mcq_options && translationDto.mcq_options.length > 0) {
      await this.createTranslationMcqOptions(prisma, textId, translationDto.mcq_options);
    }
    
    // Create match pairs if needed
    if (translationDto.match_pairs && translationDto.match_pairs.length > 0) {
      await this.createTranslationMatchPairs(prisma, textId, translationDto.match_pairs);
    }
  }
  
  private async createTranslationMcqOptions(prisma: any, textId: number, options: any[]) {
    await Promise.all(
      options.map(option => 
        prisma.mcq_Option.create({
          data: {
            question_text_id: textId,
            option_text: option.option_text,
            is_correct: option.is_correct,
            image_id: option.image_id || null
          }
        })
      )
    );
  }
  
  private async createTranslationMatchPairs(prisma: any, textId: number, pairs: any[]) {
    await Promise.all(
      pairs.map(pair => 
        prisma.match_Pair.create({
          data: {
            question_text_id: textId,
            left_text: pair.left_text || null,
            right_text: pair.right_text || null,
            left_image_id: pair.left_image_id || null,
            right_image_id: pair.right_image_id || null
          }
        })
      )
    );
  }
  
  private async createTranslationQuestionText(prisma: any, questionId: number, translationDto: AddTranslationDto) {
    return prisma.question_Text.create({
      data: {
        question_id: questionId,
        question_text: translationDto.question_text,
        image_id: translationDto.image_id || null
      }
    });
  }
  
  private async createTopicMediumAssociations(
    prisma: any, 
    questionId: number, 
    textId: number, 
    translationDto: AddTranslationDto
  ) {
    // Find all topic IDs associated with this question
    const questionTopics = await prisma.question_Topic.findMany({
      where: { question_id: questionId }
    });

    // Create associations for each topic with the new medium
    for (const questionTopic of questionTopics) {
      await prisma.question_Text_Topic_Medium.create({
        data: {
          question_text_id: textId,
          question_topic_id: questionTopic.id,
          instruction_medium_id: translationDto.instruction_medium_id,
          is_verified: false, // Always set to false for new translations
          translation_status: 'translated' // Always set to "translated" for translations
        }
      });
    }
  }
  
  private async formatTranslationResponse(prisma: any, questionId: number, newQuestionText: any, translationDto: AddTranslationDto) {
    // Get the medium name for the response
    const medium = await prisma.instruction_Medium.findUnique({
      where: { id: translationDto.instruction_medium_id }
    });

    return {
      message: "Translation added successfully",
      id: questionId,
      question_text_id: newQuestionText.id,
      question_text: translationDto.question_text,
      instruction_medium_id: translationDto.instruction_medium_id,
      medium_name: medium ? medium.instruction_medium : null
    };
  }

  /**
   * Get verified question texts for a specific question and topic
   * @param questionId The ID of the question
   * @param topicId The ID of the topic
   * @returns Question data with verified texts sorted by medium name
   */
  async getVerifiedQuestionTexts(questionId: number, topicId: number) {
    try {
      // Step 1: Validate and retrieve the necessary entities
      const { question, topic, questionTopic } = await this.validateAndFetchEntities(questionId, topicId);
      
      // Step 2: Fetch and filter verified texts
      const verifiedTexts = await this.fetchVerifiedTexts(questionId, questionTopic.id);
      
      // Step 3: Transform texts with presigned URLs
      const transformedTexts = await this.transformVerifiedTexts(verifiedTexts);
      
      // Step 4: Sort texts by medium name
      const sortedTexts = this.sortTextsByMedium(transformedTexts);
      
      // Step 5: Build the final response
      return this.buildVerifiedTextsResponse(question, topic, sortedTexts);
    } catch (error) {
      this.handleVerifiedTextsError(error, questionId, topicId);
    }
  }
  
  private async validateAndFetchEntities(questionId: number, topicId: number) {
    // Check if the question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        question_type: true
      }
    });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    
    // Check if topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        chapter: true
      }
    });
    
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }
    
    // Check if the question is associated with the topic
    const questionTopic = await this.prisma.question_Topic.findFirst({
      where: {
        question_id: questionId,
        topic_id: topicId
      }
    });
    
    if (!questionTopic) {
      throw new NotFoundException(`Question with ID ${questionId} is not associated with topic ID ${topicId}`);
    }
    
    return { question, topic, questionTopic };
  }
  
  private async fetchVerifiedTexts(questionId: number, questionTopicId: number) {
    // Get all question texts with their respective mediums that are verified
    const questionTexts = await this.prisma.question_Text.findMany({
      where: { 
        question_id: questionId
      },
      include: {
        image: true,
        mcq_options: {
          include: {
            image: true
          }
        },
        match_pairs: {
          include: {
            left_image: true,
            right_image: true
          }
        },
        question_text_topics: {
          where: {
            question_topic_id: questionTopicId,
            is_verified: true
          },
          include: {
            instruction_medium: true
          }
        }
      }
    });
    
    // Filter texts that have verified associations with the specified topic
    return questionTexts.filter(text => 
      text.question_text_topics && text.question_text_topics.length > 0
    );
  }
  
  private async transformVerifiedTexts(verifiedTexts: any[]) {
    return Promise.all(verifiedTexts.map(text => this.transformVerifiedText(text)));
  }
  
  private async transformVerifiedText(text: any) {
    // Create a fully transformed copy of the text with all images processed
    const transformedText = { ...text };
    
    // Process main image
    transformedText.image = await this.transformVerifiedTextImage(transformedText.image);
    
    // Process MCQ option images
    transformedText.mcq_options = await this.transformVerifiedTextMcqOptions(transformedText.mcq_options);
    
    // Process match pair images
    transformedText.match_pairs = await this.transformVerifiedTextMatchPairs(transformedText.match_pairs);
    
    // Format the medium information
    const medium = transformedText.question_text_topics[0]?.instruction_medium;
    
    // Return simplified structure with transformed images
    return {
      id: transformedText.id,
      question_text: transformedText.question_text,
      image_id: transformedText.image_id,
      image: transformedText.image,
      medium: this.formatMediumInfo(medium),
      translation_status: transformedText.question_text_topics[0]?.translation_status || 'original',
      mcq_options: transformedText.mcq_options || [],
      match_pairs: transformedText.match_pairs || []
    };
  }
  
  private async transformVerifiedTextImage(image: any) {
    if (!image) return null;
    return await this.transformImageData(image);
  }
  
  private async transformVerifiedTextMcqOptions(options: any[]) {
    if (!options || options.length === 0) return [];
    
    return Promise.all(options.map(async (option) => {
      const optionCopy = { ...option };
      optionCopy.image = await this.transformVerifiedTextImage(optionCopy.image);
      return optionCopy;
    }));
  }
  
  private async transformVerifiedTextMatchPairs(pairs: any[]) {
    if (!pairs || pairs.length === 0) return [];
    
    return Promise.all(pairs.map(async (pair) => {
      const pairCopy = { ...pair };
      pairCopy.left_image = await this.transformVerifiedTextImage(pairCopy.left_image);
      pairCopy.right_image = await this.transformVerifiedTextImage(pairCopy.right_image);
      return pairCopy;
    }));
  }
  
  private formatMediumInfo(medium: any) {
    if (!medium) return null;
    
    return {
      id: medium.id,
      instruction_medium: medium.instruction_medium
    };
  }
  
  private sortTextsByMedium(texts: any[]) {
    return texts.sort((a, b) => {
      const mediumA = a.medium?.instruction_medium || '';
      const mediumB = b.medium?.instruction_medium || '';
      return mediumA.localeCompare(mediumB);
    });
  }
  
  private buildVerifiedTextsResponse(question: any, topic: any, sortedTexts: any[]) {
    return {
      id: question.id,
      question_type: {
        id: question.question_type.id,
        type_name: question.question_type.type_name
      },
      board_question: question.board_question,
      topic: {
        id: topic.id,
        name: topic.name,
        chapter_id: topic.chapter_id
      },
      question_texts: sortedTexts
    };
  }
  
  private handleVerifiedTextsError(error: any, questionId: number, topicId: number): never {
    this.logger.error(`Failed to get verified question texts for question ${questionId} and topic ${topicId}:`, error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Failed to get verified question texts');
  }

  // Diagnostic method to check question-topic associations
  async checkQuestionData(id: number) {
    try {
      // Fetch a specific question and all its relationships
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_texts: {
            include: {
              question_text_topics: {
                include: {
                  question_topic: {
                    include: {
                      topic: true
                    }
                  },
                  instruction_medium: true
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });
      
      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }
      
      // Format a simplified diagnostic response
      return {
        id: question.id,
        question_type: question.question_type?.type_name,
        has_question_topics: question.question_topics && question.question_topics.length > 0,
        question_topics_count: question.question_topics?.length || 0,
        question_topics: question.question_topics?.map(qt => ({
          id: qt.id,
          topic_id: qt.topic_id,
          topic_name: qt.topic?.name
        })),
        question_texts_count: question.question_texts?.length || 0,
        question_texts: question.question_texts?.map(text => ({
          id: text.id,
          text: text.question_text,
          has_text_topic_medium: text.question_text_topics && text.question_text_topics.length > 0,
          text_topic_medium_count: text.question_text_topics?.length || 0,
          text_topic_medium: text.question_text_topics?.map(ttm => ({
            id: ttm.id,
            question_topic_id: ttm.question_topic_id,
            medium_id: ttm.instruction_medium_id,
            medium_name: ttm.instruction_medium?.instruction_medium,
            translation_status: ttm.translation_status || 'original',
            has_topic: ttm.question_topic?.topic != null,
            topic_id: ttm.question_topic?.topic?.id,
            topic_name: ttm.question_topic?.topic?.name
          }))
        }))
      };
    } catch (error) {
      this.logger.error(`Error in checkQuestionData for question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve question diagnostic data');
    }
  }

  // Additional diagnostic method to check all questions
  async checkAllQuestionsData() {
    try {
      // Get all questions with minimal data
      const questions = await this.prisma.question.findMany({
        include: {
          question_topics: {
            include: {
              topic: true
            }
          },
          question_texts: {
            include: {
              question_text_topics: {
                include: {
                  instruction_medium: true
                }
              }
            }
          }
        }
      });
      
      return questions.map(q => ({
        id: q.id,
        has_question_topics: q.question_topics && q.question_topics.length > 0,
        question_topics_count: q.question_topics?.length || 0,
        question_topics: q.question_topics?.map(qt => ({
          id: qt.id,
          topic_id: qt.topic_id,
          topic_name: qt.topic?.name
        })),
        question_texts_count: q.question_texts?.length || 0,
        question_texts: q.question_texts?.map(text => ({
          id: text.id,
          text: text.question_text,
          has_text_topic_medium: text.question_text_topics && text.question_text_topics.length > 0,
          text_topic_medium_count: text.question_text_topics?.length || 0,
          text_topic_medium: text.question_text_topics?.map(ttm => ({
            id: ttm.id,
            question_topic_id: ttm.question_topic_id,
            medium_id: ttm.instruction_medium_id,
            medium_name: ttm.instruction_medium?.instruction_medium,
            translation_status: ttm.translation_status || 'original'
          }))
        }))
      }));
    } catch (error) {
      this.logger.error('Error in checkAllQuestionsData:', error);
      throw new InternalServerErrorException('Failed to retrieve all questions diagnostic data');
    }
  }

  /**
   * Utility method to assign a default topic to questions without topics
   * This is helpful for fixing questions that don't have any topic associations
   */
  async assignDefaultTopicToQuestions() {
    try {
      // Step 1: Find all questions without any topics
      const questionsWithoutTopics = await this.findQuestionsWithoutTopics();
      
      if (questionsWithoutTopics.length === 0) {
        return { message: 'No questions without topics found', affected: 0 };
      }
      
      this.logger.log(`Found ${questionsWithoutTopics.length} questions without topics`);
      
      // Step 2: Find or create a default topic
      const defaultTopic = await this.getOrCreateDefaultTopic();
      
      if (!defaultTopic) {
        return { message: 'No chapters found in database - cannot create default topic', affected: 0 };
      }
      
      // Step 3: Create topic associations for each question
      await this.createTopicAssociations(questionsWithoutTopics, defaultTopic);
      
      return {
        message: `Created topic associations for ${questionsWithoutTopics.length} questions`,
        affected: questionsWithoutTopics.length,
        defaultTopic
      };
    } catch (error) {
      this.logger.error('Error in assignDefaultTopicToQuestions:', error);
      throw new InternalServerErrorException('Failed to assign default topics to questions');
    }
  }
  
  private async findQuestionsWithoutTopics() {
    return this.prisma.question.findMany({
      where: {
        question_topics: {
          none: {}
        }
      },
      include: {
        question_texts: {
          include: {
            question_text_topics: true
          }
        }
      }
    });
  }
  
  private async getOrCreateDefaultTopic() {
    // Try to find existing default topic
    let defaultTopic = await this.prisma.topic.findFirst({
      where: {
        name: 'General'
      }
    });
    
    if (defaultTopic) return defaultTopic;
    
    // Need to find a chapter first
    const chapter = await this.prisma.chapter.findFirst();
    
    if (!chapter) return null;
    
    // Create the default topic
    defaultTopic = await this.prisma.topic.create({
      data: {
        name: 'General',
        chapter_id: chapter.id,
        sequential_topic_number: 1
      }
    });
    
    this.logger.log(`Created default topic 'General' with ID ${defaultTopic.id}`);
    return defaultTopic;
  }
  
  private async createTopicAssociations(questions: any[], defaultTopic: any) {
    const createdAssociations = [];
    
    for (const question of questions) {
      // Create a question_topic association
      const questionTopic = await this.prisma.question_Topic.create({
        data: {
          question_id: question.id,
          topic_id: defaultTopic.id
        }
      });
      
      createdAssociations.push(questionTopic);
      
      // Create medium associations for each text
      await this.createMediumAssociationsForTexts(question.question_texts, questionTopic.id);
    }
    
    return createdAssociations;
  }
  
  private async createMediumAssociationsForTexts(texts: any[], questionTopicId: number) {
    for (const text of texts) {
      // Skip if it already has question_text_topics
      if (text.question_text_topics && text.question_text_topics.length > 0) {
        continue;
      }
      
      await this.createMediumAssociationForText(text, questionTopicId);
    }
  }
  
  private async createMediumAssociationForText(text: any, questionTopicId: number) {
    // Find a default medium
    const defaultMedium = await this.prisma.instruction_Medium.findFirst();
    
    if (!defaultMedium) {
      this.logger.warn('No instruction mediums found in database');
      return;
    }
    
    // Create the association
    try {
      await this.prisma.question_Text_Topic_Medium.create({
        data: {
          question_text_id: text.id,
          question_topic_id: questionTopicId,
          instruction_medium_id: defaultMedium.id,
          is_verified: false,
          translation_status: 'original'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to create question_text_topic_medium for question_text ${text.id}:`, error);
    }
  }

  // Add this directly after the post-processing step in findAll
  // Before the transformQuestionResults call
  
  // Ensure topics are preserved in the final data
  private ensureTopicsInQuestionData(questions) {
    return questions.map(question => {
      const result = { ...question };
      
      // Get default topic from question_topics for fallback
      let defaultTopic = null;
      if (question.question_topics && question.question_topics.length > 0 && question.question_topics[0]?.topic) {
        defaultTopic = {
          id: question.question_topics[0].topic.id,
          name: question.question_topics[0].topic.name,
          chapter_id: question.question_topics[0].topic.chapter_id
        };
        this.logger.log(`Found default topic for question ${question.id}: ${JSON.stringify(defaultTopic)}`);
      }
      
      // Process each question text to ensure it has topic data
      if (result.question_texts) {
        result.question_texts = result.question_texts.map(text => {
          const textResult = { ...text };
          
          // Get topic from question_text_topics first
          if (textResult.question_text_topics && textResult.question_text_topics.length > 0 && 
              textResult.question_text_topics[0].question_topic?.topic) {
            const topicData = textResult.question_text_topics[0].question_topic.topic;
            textResult.topic = {
              id: topicData.id,
              name: topicData.name,
              chapter_id: topicData.chapter_id
            };
            this.logger.log(`Found topic in text-topics for question ${question.id}, text ${textResult.id}: ${JSON.stringify(textResult.topic)}`);
          } 
          // Fallback to default topic from question_topics
          else if (defaultTopic) {
            textResult.topic = defaultTopic;
            this.logger.log(`Using default topic for question ${question.id}, text ${textResult.id}: ${JSON.stringify(textResult.topic)}`);
          }
          
          return textResult;
        });
      }
      
      return result;
    });
  }

  async countUntranslatedQuestions(instruction_medium_id_param: number, filters: QuestionFilterDto) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        is_verified,
        translation_status
      } = filters;

      // Basic raw query to get untranslated questions count for this medium
      const untranslatedQuestionsCount = await this.prisma.$queryRaw<[{ count: string }]>`
        SELECT COUNT(DISTINCT q.id) as count
        FROM "Question" q
        WHERE NOT EXISTS (
          SELECT 1 
          FROM "Question_Text" qt 
          JOIN "Question_Text_Topic_Medium" qttm ON qt.id = qttm.question_text_id
          WHERE qt.question_id = q.id 
          AND qttm.instruction_medium_id = ${instruction_medium_id_param}
        )
        ${topic_id ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Question_Topic" qt1
            WHERE qt1.question_id = q.id AND qt1.topic_id = ${topic_id}
          )` : 
          Prisma.sql``
        }
        ${chapter_id ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Question_Topic" qt2
            JOIN "Topic" t ON qt2.topic_id = t.id
            WHERE qt2.question_id = q.id AND t.chapter_id = ${chapter_id}
          )` : 
          Prisma.sql``
        }
        ${question_type_id ? 
          Prisma.sql`AND q.question_type_id = ${question_type_id}` : 
          Prisma.sql``
        }
        ${board_question !== undefined ? 
          Prisma.sql`AND q.board_question = ${board_question}` : 
          Prisma.sql``
        }
        ${is_verified === true ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM "Question_Text" qt3 
            JOIN "Question_Text_Topic_Medium" qttm3 ON qt3.id = qttm3.question_text_id
            WHERE qt3.question_id = q.id 
            AND qttm3.is_verified = true
          )` : 
          Prisma.sql``
        }
        ${translation_status ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM "Question_Text" qt4 
            JOIN "Question_Text_Topic_Medium" qttm4 ON qt4.id = qttm4.question_text_id
            WHERE qt4.question_id = q.id 
            AND qttm4.translation_status = ${translation_status}
          )` : 
          Prisma.sql``
        }
      `;

      // Extract count value and convert to number
      const count = parseInt(untranslatedQuestionsCount[0]?.count || '0', 10);

      // Add diagnostic logging
      this.logger.log(`Found ${count} untranslated questions for medium ${instruction_medium_id_param}`);
      
      return { 
        count,
        medium_id: instruction_medium_id_param,
        filters: {
          question_type_id,
          topic_id,
          chapter_id,
          board_question,
          is_verified,
          translation_status
        }
      };
    } catch (error) {
      this.logger.error(`Error counting untranslated questions for medium ${instruction_medium_id_param}:`, error);
      throw new InternalServerErrorException('Failed to count untranslated questions');
    }
  }

  async countQuestions(filters: QuestionCountFilterDto) {
    try {
      const {
        chapter_id,
        instruction_medium_id,
        is_verified
      } = filters;

      // Build the where conditions
      const whereConditions: any = {};

      // Add chapter filter if specified
      if (chapter_id !== undefined) {
        whereConditions.question_topics = {
          some: {
            topic: {
              chapter_id
            }
          }
        };
      }

      // Handle medium and verification filters together
      if (instruction_medium_id !== undefined || is_verified !== undefined) {
        const topicCondition = {
          question_text_topics: {
            some: {} as Record<string, any>
          }
        };
        
        // Add medium filter if specified
        if (instruction_medium_id !== undefined) {
          topicCondition.question_text_topics.some.instruction_medium_id = instruction_medium_id;
        }
        
        // Add verification status filter if specified
        if (is_verified !== undefined) {
          topicCondition.question_text_topics.some.is_verified = is_verified;
        }
        
        // Add to existing question_texts condition or create a new one
        if (whereConditions.question_texts) {
          // If we already have a question_texts condition, we need to combine them
          whereConditions.question_texts = {
            some: {
              AND: [
                whereConditions.question_texts.some,
                topicCondition
              ]
            }
          };
        } else {
          // Create new question_texts condition
          whereConditions.question_texts = {
            some: topicCondition
          };
        }
      }

      // Log the constructed where conditions for debugging
      this.logger.log(`Constructed where conditions for count: ${JSON.stringify(whereConditions)}`);

      // Count total questions matching the criteria
      const count = await this.prisma.question.count({
        where: whereConditions
      });

      this.logger.log(`Counted ${count} questions with filters: ${JSON.stringify(filters)}`);

      return {
        count,
        filters: {
          chapter_id,
          instruction_medium_id,
          is_verified
        }
      };
    } catch (error) {
      this.logger.error('Error counting questions:', error);
      throw new InternalServerErrorException('Failed to count questions');
    }
  }
} 