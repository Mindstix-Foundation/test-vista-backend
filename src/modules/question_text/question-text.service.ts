import { Injectable, Logger, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateQuestionTextDto, 
  UpdateQuestionTextDto, 
  QuestionTextSortField,
  UpdateMcqOptionDto,
  UpdateMatchPairDto,
  CreateMcqOptionDto,
  CreateMatchPairDto
} from './dto/question-text.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { AwsS3Service } from '../aws/aws-s3.service';

interface QuestionTextFilters {
  topic_id?: number;
  chapter_id?: number;
  question_type_id?: number;
  instruction_medium_id?: number;
  is_verified?: boolean;
  question_id?: number;
  page?: number;
  page_size?: number;
  sort_by?: QuestionTextSortField;
  sort_order?: SortOrder;
  search?: string;
}

@Injectable()
export class QuestionTextService {
  private readonly logger = new Logger(QuestionTextService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service
  ) {}

  async create(createQuestionTextDto: CreateQuestionTextDto) {
    try {
      const { 
        question_id, 
        question_text, 
        mcq_options, 
        match_pairs,
        image_id
      } = createQuestionTextDto;

      // Validate all entities before starting the transaction
      await this.validateQuestion(question_id);
      
      if (image_id !== undefined && image_id !== null) {
        await this.validateImage(image_id);
      }

      // Create the question text and related items
      return await this.prisma.$transaction(async (prisma) => {
        // Create the question text
        const newQuestionText = await this.createQuestionTextRecord(
          prisma, 
          question_id, 
          question_text, 
          image_id
        );

        // Process MCQ options if provided
        if (mcq_options?.length > 0) {
          await this.createMcqOptions(prisma, mcq_options, newQuestionText.id);
        }

        // Process match pairs if provided
        if (match_pairs?.length > 0) {
          await this.createMatchPairs(prisma, match_pairs, newQuestionText.id);
        }

        // Fetch and return the created question text with relations
        return await this.fetchQuestionTextWithRelations(prisma, newQuestionText.id);
      });
    } catch (error) {
      this.handleCreateError(error);
    }
  }

  // Helper methods to reduce cognitive complexity

  private async validateQuestion(questionId: number): Promise<void> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { question_topics: true }
    });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
  }

  private async validateImage(imageId: number): Promise<void> {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId }
    });
    
    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }
  }

  private async createQuestionTextRecord(
    prisma: Prisma.TransactionClient,
    questionId: number,
    questionText: string,
    imageId?: number
  ) {
    return prisma.question_Text.create({
      data: {
        question_id: questionId,
        question_text: questionText,
        ...(imageId !== undefined && imageId !== null ? { image_id: imageId } : {})
      }
    });
  }

  private async createMcqOptions(
    prisma: Prisma.TransactionClient,
    options: CreateMcqOptionDto[],
    questionTextId: number
  ): Promise<void> {
    await Promise.all(options.map(async (option) => {
      await this.validateOptionImage(option.image_id);
      
      return prisma.mcq_Option.create({
        data: {
          option_text: option.option_text,
          is_correct: option.is_correct ?? false,
          ...(option.image_id !== undefined && option.image_id !== null 
            ? { image_id: option.image_id } 
            : {}),
          question_text_id: questionTextId
        }
      });
    }));
  }
  
  private async validateOptionImage(imageId?: number): Promise<void> {
    if (imageId !== undefined && imageId !== null) {
      const image = await this.prisma.image.findUnique({
        where: { id: imageId }
      });
      
      if (!image) {
        throw new NotFoundException(`Image with ID ${imageId} for MCQ option not found`);
      }
    }
  }

  private async createMatchPairs(
    prisma: Prisma.TransactionClient,
    pairs: CreateMatchPairDto[],
    questionTextId: number
  ): Promise<void> {
    await Promise.all(pairs.map(async (pair) => {
      await this.validateMatchPairImages(pair.left_image_id, pair.right_image_id);
      
      return prisma.match_Pair.create({
        data: {
          ...(pair.left_text ? { left_text: pair.left_text } : {}),
          ...(pair.right_text ? { right_text: pair.right_text } : {}),
          ...(pair.left_image_id !== undefined && pair.left_image_id !== null 
            ? { left_image_id: pair.left_image_id } 
            : {}),
          ...(pair.right_image_id !== undefined && pair.right_image_id !== null 
            ? { right_image_id: pair.right_image_id } 
            : {}),
          question_text_id: questionTextId
        }
      });
    }));
  }
  
  private async validateMatchPairImages(leftImageId?: number, rightImageId?: number): Promise<void> {
    if (leftImageId !== undefined && leftImageId !== null) {
      const leftImage = await this.prisma.image.findUnique({
        where: { id: leftImageId }
      });
      
      if (!leftImage) {
        throw new NotFoundException(`Left image with ID ${leftImageId} for match pair not found`);
      }
    }
    
    if (rightImageId !== undefined && rightImageId !== null) {
      const rightImage = await this.prisma.image.findUnique({
        where: { id: rightImageId }
      });
      
      if (!rightImage) {
        throw new NotFoundException(`Right image with ID ${rightImageId} for match pair not found`);
      }
    }
  }
  
  private async fetchQuestionTextWithRelations(
    prisma: Prisma.TransactionClient,
    questionTextId: number
  ) {
    return prisma.question_Text.findUnique({
      where: { id: questionTextId },
      include: {
        question: {
          include: {
            question_type: true,
            question_topics: {
              include: {
                topic: {
                  include: {
                    chapter: true
                  }
                }
              }
            }
          }
        },
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
    });
  }
  
  private handleCreateError(error: any): never {
    this.logger.error('Failed to create question text:', error);
    
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException ||
        error instanceof ConflictException) {
      throw error;
    }
    
    throw new InternalServerErrorException('Failed to create question text');
  }

  async findAll(filters: QuestionTextFilters) {
    try {
      const { 
        page = 1, 
        page_size = 10, 
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC
      } = filters;
      
      const skip = (page - 1) * page_size;
      
      // Build where clause using helper method
      const where = this.buildFindAllWhereClause(filters);
      
      // Get total count for pagination metadata
      const total = await this.prisma.question_Text.count({ where });
      
      // Validate sort field and build orderBy object
      const validatedSortBy = this.validateSortField(sort_by);
      const orderBy = this.buildSortingCriteria(validatedSortBy, sort_order);
      
      // Get paginated data with sorting
      const questionTexts = await this.prisma.question_Text.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        include: {
          question: {
            include: {
              question_type: true,
              question_topics: {
                include: {
                  topic: true
                }
              }
            }
          },
          image: true,
          mcq_options: true,
          match_pairs: true,
          question_text_topics: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
      
      // Calculate total pages
      const total_pages = Math.ceil(total / page_size);
      
      return {
        data: questionTexts,
        meta: {
          total,
          page,
          page_size,
          total_pages,
          sort_by: validatedSortBy,
          sort_order,
          search: filters.search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch question texts:', error);
      throw new InternalServerErrorException('Failed to fetch question texts');
    }
  }

  /**
   * Build where clause for findAll queries
   */
  private buildFindAllWhereClause(filters: QuestionTextFilters): Prisma.Question_TextWhereInput {
    const { 
      topic_id, 
      chapter_id, 
      question_type_id,
      instruction_medium_id,
      is_verified,
      search
    } = filters;
    
    let where: Prisma.Question_TextWhereInput = {};
    const andConditions: Prisma.Question_TextWhereInput[] = [];
    
    // Build question-related conditions
    const questionConditions = this.buildQuestionConditions(topic_id, chapter_id, question_type_id);
    if (Object.keys(questionConditions).length > 0) {
      where.question = questionConditions;
    }
    
    // Add instruction medium filter
    this.addInstructionMediumFilter(andConditions, instruction_medium_id);
    
    // Add verification status filter
    this.addVerificationStatusFilter(andConditions, is_verified);
    
    // Add search condition
    if (search) {
      where.question_text = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Add AND conditions if any
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    
    return where;
  }

  /**
   * Build question-related conditions for filtering
   */
  private buildQuestionConditions(
    topicId?: number, 
    chapterId?: number, 
    questionTypeId?: number
  ): Prisma.QuestionWhereInput {
    const questionConditions: Prisma.QuestionWhereInput = {};
    
    if (!topicId && !chapterId && !questionTypeId) {
      return questionConditions;
    }
    
    if (questionTypeId) {
      questionConditions.question_type_id = questionTypeId;
    }
    
    if (topicId || chapterId) {
      questionConditions.question_topics = {
        some: this.buildTopicConditions(topicId, chapterId)
      };
    }
    
    return questionConditions;
  }

  /**
   * Build topic conditions for filtering
   */
  private buildTopicConditions(
    topicId?: number, 
    chapterId?: number
  ): Prisma.Question_TopicWhereInput {
    const topicConditions: Prisma.Question_TopicWhereInput = {};
    
    if (topicId) {
      topicConditions.topic_id = parseInt(String(topicId), 10);
    }
    
    if (chapterId) {
      topicConditions.topic = {
        chapter_id: parseInt(String(chapterId), 10)
      };
    }
    
    return topicConditions;
  }

  /**
   * Add instruction medium filter to conditions
   */
  private addInstructionMediumFilter(
    conditions: Prisma.Question_TextWhereInput[],
    instructionMediumId?: number
  ): void {
    if (!instructionMediumId) return;
    
    // Ensure instruction_medium_id is a number
    const mediumId = typeof instructionMediumId === 'string' 
      ? parseInt(instructionMediumId, 10) 
      : instructionMediumId;
    
    this.logger.log(`Filtering question texts with instruction_medium_id: ${mediumId}`);
    
    conditions.push({
      question_text_topics: {
        some: {
          instruction_medium: {
            id: mediumId
          }
        }
      }
    });
  }

  /**
   * Add verification status filter to conditions
   */
  private addVerificationStatusFilter(
    conditions: Prisma.Question_TextWhereInput[],
    isVerified?: boolean
  ): void {
    if (isVerified === undefined) return;
    
    this.logger.log(`Filtering question texts with is_verified: ${isVerified}`);
    
    conditions.push({
      question_text_topics: {
        some: {
          is_verified: isVerified
        }
      }
    });
  }

  /**
   * Build sorting criteria for queries
   */
  private buildSortingCriteria(
    sortBy: QuestionTextSortField, 
    sortOrder: SortOrder
  ): Record<string, SortOrder> {
    const orderBy: Record<string, SortOrder> = {};
    
    // Validate the sort field using the helper method
    const validatedSortBy = this.validateSortField(sortBy);
    orderBy[validatedSortBy] = sortOrder;
    
    return orderBy;
  }

  async findOne(id: number) {
    try {
      const questionText = await this.prisma.question_Text.findUnique({
        where: { id },
        include: {
          question: {
            include: {
              question_type: {
                select: {
                  id: true,
                  type_name: true
                }
              },
              question_topics: {
                include: {
                  topic: {
                    select: {
                      id: true,
                      name: true,
                      chapter: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
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
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${id} not found`);
      }

      // Transform the response to remove created_at and updated_at fields
      // and add presigned URLs for images
      const transformedResponse = {
        id: questionText.id,
        question_id: questionText.question_id,
        question_text: questionText.question_text,
        image: questionText.image ? {
          id: questionText.image.id,
          url: await this.awsS3Service.generatePresignedUrl(questionText.image.image_url),
          alt_text: questionText.image.original_filename || ''
        } : null,
        question_type: questionText.question.question_type.type_name,
        topics: questionText.question.question_topics.map(qt => ({
          id: qt.topic.id,
          name: qt.topic.name,
          chapter: {
            id: qt.topic.chapter.id,
            name: qt.topic.chapter.name
          }
        })),
        mcq_options: await Promise.all(questionText.mcq_options.map(async option => ({
          id: option.id,
          option_text: option.option_text,
          is_correct: option.is_correct,
          image: option.image ? {
            id: option.image.id,
            url: await this.awsS3Service.generatePresignedUrl(option.image.image_url),
            alt_text: option.image.original_filename || ''
          } : null
        }))),
        match_pairs: await Promise.all(questionText.match_pairs.map(async pair => ({
          id: pair.id,
          left_text: pair.left_text,
          right_text: pair.right_text,
          left_image: pair.left_image ? {
            id: pair.left_image.id,
            url: await this.awsS3Service.generatePresignedUrl(pair.left_image.image_url),
            alt_text: pair.left_image.original_filename || ''
          } : null,
          right_image: pair.right_image ? {
            id: pair.right_image.id,
            url: await this.awsS3Service.generatePresignedUrl(pair.right_image.image_url),
            alt_text: pair.right_image.original_filename || ''
          } : null
        }))),
        instruction_mediums: questionText.question_text_topics.map(qtt => ({
          id: qtt.instruction_medium.id,
          name: qtt.instruction_medium.instruction_medium,
          is_verified: qtt.is_verified,
          translation_status: qtt.translation_status
        }))
      };

      return transformedResponse;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch question text with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to fetch question text with ID ${id}`);
    }
  }

  async update(id: number, updateQuestionTextDto: UpdateQuestionTextDto) {
    try {
      const { question_text, mcq_options, match_pairs, image_id } = updateQuestionTextDto;

      // Validate the question text and image existence
      await this.validateQuestionTextAndImage(id, image_id);
      
      // Process update in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Update the question text record
        await this.updateQuestionTextRecord(prisma, id, question_text, image_id);
        
        // Process MCQ options if provided
        if (mcq_options) {
          await this.processMcqOptions(prisma, id, mcq_options);
        }
        
        // Process match pairs if provided
        if (match_pairs) {
          await this.processMatchPairs(prisma, id, match_pairs);
        }
        
        // Return the updated question text with relations
        return await this.fetchQuestionTextWithRelations(prisma, id);
      });
    } catch (error) {
      this.handleUpdateError(error, id);
    }
  }
  
  /**
   * Validates that the question text exists and image ID is valid
   */
  private async validateQuestionTextAndImage(id: number, imageId?: number): Promise<void> {
    // Check if the question text exists
    const questionText = await this.prisma.question_Text.findUnique({
      where: { id },
      include: {
        mcq_options: true,
        match_pairs: true
      }
    });
    
    if (!questionText) {
      throw new NotFoundException(`Question text with ID ${id} not found`);
    }
    
    // Check if image exists if image_id is provided
    if (imageId !== undefined && imageId !== null) {
      await this.validateImage(imageId);
    }
  }
  
  /**
   * Updates the question text record
   */
  private async updateQuestionTextRecord(
    prisma: Prisma.TransactionClient,
    id: number,
    questionText?: string,
    imageId?: number
  ): Promise<void> {
    await prisma.question_Text.update({
      where: { id },
      data: {
        ...(questionText ? { question_text: questionText } : {}),
        ...(imageId !== undefined ? { image_id: imageId } : {})
      }
    });
  }
  
  /**
   * Processes MCQ options for a question text
   */
  private async processMcqOptions(
    prisma: Prisma.TransactionClient,
    questionTextId: number,
    options: UpdateMcqOptionDto[]
  ): Promise<void> {
    // Get existing MCQ options
    const existingOptions = await prisma.mcq_Option.findMany({
      where: { question_text_id: questionTextId }
    });
    
    // Create a map of existing options by ID for easy lookup
    const existingOptionsMap = new Map(
      existingOptions.map(option => [option.id, option])
    );
    
    // Process each MCQ option
    for (const option of options) {
      await this.validateOptionImage(option.image_id);
      
      if (option.id) {
        await this.updateMcqOption(prisma, option, existingOptionsMap);
      } else {
        await this.createMcqOption(prisma, questionTextId, option);
      }
    }
    
    // Delete any remaining options that weren't updated
    await this.deleteRemainingMcqOptions(prisma, existingOptionsMap);
  }
  
  /**
   * Updates an existing MCQ option
   */
  private async updateMcqOption(
    prisma: Prisma.TransactionClient,
    option: UpdateMcqOptionDto,
    existingOptionsMap: Map<number, any>
  ): Promise<void> {
    if (!option.id) return;
    
    if (existingOptionsMap.has(option.id)) {
      await prisma.mcq_Option.update({
        where: { id: option.id },
        data: {
          option_text: option.option_text,
          is_correct: option.is_correct,
          ...(option.image_id !== undefined ? { image_id: option.image_id } : {})
        }
      });
      
      // Remove from map to track what's been processed
      existingOptionsMap.delete(option.id);
    } else {
      throw new NotFoundException(`MCQ option with ID ${option.id} not found`);
    }
  }
  
  /**
   * Creates a new MCQ option
   */
  private async createMcqOption(
    prisma: Prisma.TransactionClient,
    questionTextId: number,
    option: UpdateMcqOptionDto
  ): Promise<void> {
    await prisma.mcq_Option.create({
      data: {
        question_text_id: questionTextId,
        option_text: option.option_text,
        is_correct: option.is_correct ?? false,
        ...(option.image_id !== undefined && option.image_id !== null 
          ? { image_id: option.image_id } 
          : {})
      }
    });
  }
  
  /**
   * Deletes MCQ options that weren't updated
   */
  private async deleteRemainingMcqOptions(
    prisma: Prisma.TransactionClient,
    existingOptionsMap: Map<number, any>
  ): Promise<void> {
    if (existingOptionsMap.size > 0) {
      await prisma.mcq_Option.deleteMany({
        where: {
          id: {
            in: Array.from(existingOptionsMap.keys())
          }
        }
      });
    }
  }
  
  /**
   * Processes match pairs for a question text
   */
  private async processMatchPairs(
    prisma: Prisma.TransactionClient,
    questionTextId: number,
    pairs: UpdateMatchPairDto[]
  ): Promise<void> {
    // Get existing match pairs
    const existingPairs = await prisma.match_Pair.findMany({
      where: { question_text_id: questionTextId }
    });
    
    // Create a map of existing pairs by ID for easy lookup
    const existingPairsMap = new Map(
      existingPairs.map(pair => [pair.id, pair])
    );
    
    // Process each match pair
    for (const pair of pairs) {
      await this.validateMatchPairImages(pair.left_image_id, pair.right_image_id);
      
      if (pair.id) {
        await this.updateMatchPair(prisma, pair, existingPairsMap);
      } else {
        await this.createMatchPair(prisma, questionTextId, pair);
      }
    }
    
    // Delete any remaining pairs that weren't updated
    await this.deleteRemainingMatchPairs(prisma, existingPairsMap);
  }
  
  /**
   * Updates an existing match pair
   */
  private async updateMatchPair(
    prisma: Prisma.TransactionClient,
    pair: UpdateMatchPairDto,
    existingPairsMap: Map<number, any>
  ): Promise<void> {
    if (!pair.id) return;
    
    if (existingPairsMap.has(pair.id)) {
      await prisma.match_Pair.update({
        where: { id: pair.id },
        data: {
          ...(pair.left_text ? { left_text: pair.left_text } : {}),
          ...(pair.right_text ? { right_text: pair.right_text } : {}),
          ...(pair.left_image_id !== undefined ? { left_image_id: pair.left_image_id } : {}),
          ...(pair.right_image_id !== undefined ? { right_image_id: pair.right_image_id } : {})
        }
      });
      
      // Remove from map to track what's been processed
      existingPairsMap.delete(pair.id);
    } else {
      throw new NotFoundException(`Match pair with ID ${pair.id} not found`);
    }
  }
  
  /**
   * Creates a new match pair
   */
  private async createMatchPair(
    prisma: Prisma.TransactionClient,
    questionTextId: number,
    pair: UpdateMatchPairDto
  ): Promise<void> {
    await prisma.match_Pair.create({
      data: {
        question_text_id: questionTextId,
        ...(pair.left_text ? { left_text: pair.left_text } : {}),
        ...(pair.right_text ? { right_text: pair.right_text } : {}),
        ...(pair.left_image_id !== undefined && pair.left_image_id !== null 
          ? { left_image_id: pair.left_image_id } 
          : {}),
        ...(pair.right_image_id !== undefined && pair.right_image_id !== null 
          ? { right_image_id: pair.right_image_id } 
          : {})
      }
    });
  }
  
  /**
   * Deletes match pairs that weren't updated
   */
  private async deleteRemainingMatchPairs(
    prisma: Prisma.TransactionClient,
    existingPairsMap: Map<number, any>
  ): Promise<void> {
    if (existingPairsMap.size > 0) {
      await prisma.match_Pair.deleteMany({
        where: {
          id: {
            in: Array.from(existingPairsMap.keys())
          }
        }
      });
    }
  }
  
  /**
   * Handles errors thrown during the update process
   */
  private handleUpdateError(error: any, id: number): never {
    this.logger.error(`Failed to update question text ${id}:`, error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new InternalServerErrorException(`Failed to update question text ${id}`);
  }

  async remove(id: number): Promise<{ message: string; deleted: { question_text: boolean; question?: boolean } }> {
    try {
      // Check if the record exists
      await this.prisma.question_Text.findUniqueOrThrow({
        where: { id }
      }).catch(() => {
        throw new NotFoundException(`Question text with ID ${id} not found`);
      });
      
      // Delete the question text (will cascade delete mcq_options, match_pairs, topic_medium associations)
      await this.prisma.question_Text.delete({
        where: { id }
      });
      
      return {
        message: 'Question text deleted successfully',
        deleted: {
          question_text: true
        }
      };
    } catch (error) {
      this.logger.error(`Failed to delete question text ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete question text ${id}`);
    }
  }

  async findAllWithoutPagination(filters: Omit<QuestionTextFilters, 'page' | 'page_size'>) {
    try {
      const { 
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
      } = filters;
      
      // Build where clause using the same helper method used by findAll
      const where = this.buildFindAllWhereClause(filters);
      
      // Validate and build sorting criteria
      const validatedSortBy = this.validateSortField(sort_by);
      const orderBy = this.buildSortingCriteria(validatedSortBy, sort_order);
      
      // Get all question texts with sorting but without pagination
      const questionTexts = await this.prisma.question_Text.findMany({
        where,
        orderBy,
        include: {
          question: {
            include: {
              question_type: true,
              question_topics: {
                include: {
                  topic: true
                }
              }
            }
          },
          image: true,
          mcq_options: true,
          match_pairs: true,
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
      });
      
      return {
        data: questionTexts,
        meta: {
          sort_by: validatedSortBy,
          sort_order,
          search: filters.search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all question texts:', error);
      throw new InternalServerErrorException('Failed to fetch all question texts');
    }
  }
  
  /**
   * Validates sort field and returns a valid sort field
   */
  private validateSortField(sortBy: QuestionTextSortField): QuestionTextSortField {
    const validSortFields = Object.values(QuestionTextSortField);
    return validSortFields.includes(sortBy as any)
      ? sortBy as QuestionTextSortField
      : QuestionTextSortField.CREATED_AT;
  }

  // Find question texts that need translation
  async findUntranslatedTexts(filters: QuestionTextFilters) {
    try {
      // Check for required instruction_medium_id
      if (!filters.instruction_medium_id) {
        throw new BadRequestException('instruction_medium_id is required to find untranslated texts');
      }

      const {
        page = 1,
        page_size = 10,
        sort_by = QuestionTextSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search
      } = filters;

      // Build where clause for untranslated texts
      const where = this.buildUntranslatedTextsWhereClause(filters);
      
      // Calculate pagination parameters
      const skip = (page - 1) * page_size;
      
      // Validate sort field
      const validatedSortBy = this.validateSortField(sort_by);

      // Get count and data
      const data = await this.fetchUntranslatedTextsWithPagination(
        where, skip, page_size, validatedSortBy, sort_order
      );
      
      // Build and return response
      return this.buildUntranslatedTextsResponse(
        data.questionTexts, 
        data.totalCount, 
        page, 
        page_size, 
        validatedSortBy, 
        sort_order, 
        search
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to fetch untranslated question texts:', error);
      throw new InternalServerErrorException('Failed to fetch untranslated question texts');
    }
  }

  /**
   * Build where clause for untranslated texts query
   */
  private buildUntranslatedTextsWhereClause(filters: QuestionTextFilters): Prisma.Question_TextWhereInput {
    const { instruction_medium_id, search } = filters;
    
    // Start with basic where clause from question conditions
    let where: Prisma.Question_TextWhereInput = {};
    const andConditions: Prisma.Question_TextWhereInput[] = [];
    
    // Add question-related filters using the helper method
    const questionConditions = this.buildQuestionConditions(
      filters.topic_id, 
      filters.chapter_id, 
      filters.question_type_id
    );
    
    if (Object.keys(questionConditions).length > 0) {
      where.question = questionConditions;
    }
    
    // Add search condition
    if (search) {
      where.question_text = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Add condition for missing instruction medium
    this.addMissingInstructionMediumCondition(andConditions, instruction_medium_id);
    
    // If we have AND conditions, add them to the where clause
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    
    return where;
  }
  
  /**
   * Add condition to find texts that don't have the specified instruction medium
   */
  private addMissingInstructionMediumCondition(
    conditions: Prisma.Question_TextWhereInput[],
    instructionMediumId?: number
  ): void {
    if (!instructionMediumId) return;
    
    // Ensure instruction_medium_id is a number
    const mediumId = typeof instructionMediumId === 'string'
      ? parseInt(instructionMediumId, 10)
      : instructionMediumId;
      
    this.logger.log(`Finding untranslated texts for instruction_medium_id: ${mediumId}`);
    
    // Add condition to find question texts that don't have a record in question_text_topics
    // with the specified instruction_medium_id
    conditions.push({
      NOT: {
        question_text_topics: {
          some: {
            instruction_medium: {
              id: mediumId
            }
          }
        }
      }
    });
  }
  
  /**
   * Fetch untranslated texts with pagination
   */
  private async fetchUntranslatedTextsWithPagination(
    where: Prisma.Question_TextWhereInput,
    skip: number,
    take: number, 
    sortBy: QuestionTextSortField,
    sortOrder: SortOrder
  ) {
    // Get count of all matching question texts
    const totalCount = await this.prisma.question_Text.count({ where });
    
    // Get question texts with pagination
    const questionTexts = await this.prisma.question_Text.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        question: {
          include: {
            question_type: true,
            question_topics: {
              include: {
                topic: {
                  include: {
                    chapter: true
                  }
                }
              }
            }
          }
        },
        image: true,
        mcq_options: true,
        match_pairs: true,
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
    });
    
    return { questionTexts, totalCount };
  }
  
  /**
   * Build response for untranslated texts query
   */
  private buildUntranslatedTextsResponse(
    questionTexts: any[],
    totalCount: number,
    page: number,
    pageSize: number,
    sortBy: QuestionTextSortField,
    sortOrder: SortOrder,
    search?: string
  ) {
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      data: questionTexts,
      meta: {
        current_page: page,
        page_size: pageSize,
        total_items: totalCount,
        total_pages: totalPages,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: search || undefined
      }
    };
  }
} 