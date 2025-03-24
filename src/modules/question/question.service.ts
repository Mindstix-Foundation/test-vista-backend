import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField, ComplexCreateQuestionDto, CompleteQuestionDto, EditCompleteQuestionDto, RemoveQuestionFromChapterDto } from './dto/question.dto';
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
}

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

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
      result.question_texts = await Promise.all(result.question_texts.map(async (text) => {
        if (!text) return null;
        
        // Deep clone to avoid mutation
        const textResult = { ...text };
        
        // Transform main image
        if (textResult.image) {
          textResult.image = await this.transformImageData(textResult.image);
          // Log for debugging
          this.logger.debug(`Transformed image ${textResult.image?.id} for question text ${textResult.id}`);
        }
        
        // Transform MCQ option images
        if (textResult.mcq_options && textResult.mcq_options.length > 0) {
          textResult.mcq_options = await Promise.all(textResult.mcq_options.map(async (option) => {
            if (!option) return null;
            
            const optionResult = { ...option };
            if (optionResult.image) {
              optionResult.image = await this.transformImageData(optionResult.image);
              // Log for debugging
              this.logger.debug(`Transformed image ${optionResult.image?.id} for MCQ option ${optionResult.id}`);
            }
            return optionResult;
          }));
        }
        
        // Transform match pair images
        if (textResult.match_pairs && textResult.match_pairs.length > 0) {
          textResult.match_pairs = await Promise.all(textResult.match_pairs.map(async (pair) => {
            if (!pair) return null;
            
            const pairResult = { ...pair };
            if (pairResult.left_image) {
              pairResult.left_image = await this.transformImageData(pairResult.left_image);
              // Log for debugging
              this.logger.debug(`Transformed left image ${pairResult.left_image?.id} for match pair ${pairResult.id}`);
            }
            if (pairResult.right_image) {
              pairResult.right_image = await this.transformImageData(pairResult.right_image);
              // Log for debugging
              this.logger.debug(`Transformed right image ${pairResult.right_image?.id} for match pair ${pairResult.id}`);
            }
            return pairResult;
          }));
        }
        
        return textResult;
      }));
    }
    
    return result;
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
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        instruction_medium_id,
        page = 1,
        page_size = 10,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search
      } = filters;

      // Define where conditions for main query
      const whereConditions: any = {};

      // Basic filters
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

      // Instruction medium filter needs to go through question_texts and the junction table
      if (instruction_medium_id !== undefined) {
        whereConditions.question_texts = {
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id
              }
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
              mode: 'insensitive'
            }
          }
        };
      }

      // Handle sorting: map sort_by to actual DB field
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT || sort_by === QuestionSortField.UPDATED_AT) {
        orderBy[sort_by] = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        orderBy.question_type_id = sort_order;
      } else if (sort_by === QuestionSortField.BOARD_QUESTION) {
        orderBy.board_question = sort_order;
      } else {
        // Default sort by creation date
        orderBy.created_at = SortOrder.DESC;
      }

      // Pagination
      const skip = (page - 1) * page_size;
      const take = page_size;

      // Query total count
      const totalCount = await this.prisma.question.count({
        where: whereConditions
      });

      // Query data with pagination
      const questions = await this.prisma.question.findMany({
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
                      topic: {
                        include: {
                          chapter: true
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
                include: {
                  chapter: true
                }
              }
            }
          }
        }
      });

      // Transform data for response
      const transformedQuestions = await this.transformQuestionResults(questions);

      return {
        data: transformedQuestions,
        meta: {
          total_count: totalCount,
          page,
          page_size,
          total_pages: Math.ceil(totalCount / page_size)
        }
      };
    } catch (error) {
      this.logger.error('Error in findAll questions:', error);
      throw new InternalServerErrorException('Failed to retrieve questions');
    }
  }

  async findOne(id: number) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_topics: {
            include: {
              topic: {
                include: {
                  chapter: {
                    include: {
                      subject: true,
                      standard: true
                    }
                  }
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
        },
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // Transform the question to include presigned URLs
      return await this.transformSingleQuestion(question);
    } catch (error) {
      this.logger.error(`Failed to fetch question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch question');
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
      const question = await this.findOne(id);

      // Log what will be deleted
      this.logger.log(`Deleting question ${id} will also delete:
        - ${question.question_texts.length} question texts
        - ${question.question_texts.reduce((sum, qt) => sum + qt.mcq_options.length, 0)} MCQ options
        - ${question.question_texts.reduce((sum, qt) => sum + qt.match_pairs.length, 0)} match pairs
        - ${question.question_topics.length} topic associations
        and all their related images will be preserved (references set to null)`);

      await this.prisma.question.delete({
        where: { id }
      });

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
        question_type_id, 
        topic_id, 
        chapter_id, 
        board_question,
        instruction_medium_id,
        sort_by = QuestionSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      this.logger.log(`Question findAllWithoutPagination called with params:
        - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
        - other filters: question_type_id=${question_type_id}, topic_id=${topic_id}, chapter_id=${chapter_id}
      `);
      
      // Build where clause
      let where: Prisma.QuestionWhereInput = {};
      const andConditions: Array<Prisma.QuestionWhereInput> = [];
      
      if (question_type_id) {
        where.question_type_id = question_type_id;
      }
      
      if (topic_id) {
        where.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      if (chapter_id) {
        where.question_topics = {
          some: {
            topic: {
              chapter_id: chapter_id
            }
          }
        };
      }
      
      if (board_question !== undefined) {
        where.board_question = board_question;
      }
      
      // Handle filtering by instruction_medium_id using the junction table
      if (instruction_medium_id) {
        const mediumId = typeof instruction_medium_id === 'string' 
          ? parseInt(instruction_medium_id, 10) 
          : instruction_medium_id;
          
        this.logger.log(`Filtering questions by instruction_medium_id: ${mediumId}`);
        
        andConditions.push({
          question_topics: {
            some: {
              question_text_topics: {
                some: {
                  instruction_medium: {
                    id: mediumId
                  }
                }
              }
            }
          }
        });
      }
      
      // Add search capability if needed
      if (search) {
        andConditions.push({
          question_texts: {
            some: {
              question_text: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        });
      }
      
      // If we have AND conditions, add them to the where clause
      if (andConditions.length > 0) {
        where = {
          ...where,
          AND: andConditions
        };
      }
      
      // Build orderBy object
      const orderBy: Prisma.QuestionOrderByWithRelationInput = {};
      orderBy[sort_by as keyof Prisma.QuestionOrderByWithRelationInput] = sort_order;
      
      // Get data with sorting but without pagination
      this.logger.log(`Fetching all questions without pagination`);
      const questions = await this.prisma.question.findMany({
        where,
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
      
      // Transform questions to include presigned URLs
      const transformedQuestions = await this.transformQuestionResults(questions);
      
      // Filter out questions with empty question_texts arrays when filters are applied
      const filteredQuestions = transformedQuestions.filter(question => {
        // Only filter out empty arrays if we're applying text-specific filters
        if (instruction_medium_id !== undefined && 
            (!question.question_texts || question.question_texts.length === 0)) {
          return false;
        }
        return true;
      });
      
      return filteredQuestions;
    } catch (error) {
      this.logger.error('Failed to fetch questions without pagination:', error);
      throw new InternalServerErrorException('Failed to fetch questions without pagination');
    }
  }

  async findUntranslatedQuestions(
    instruction_medium_id_param: number,
    filters: QuestionFilterDto,
    sort_by = 'created_at',
    sort_order: 'asc' | 'desc' = 'desc'
  ) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        page = 1,
        page_size = 10,
        search
      } = filters;

      const whereConditions: any = {};

      // Basic filters
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
              mode: 'insensitive'
            }
          }
        };
      }

      // NOT EXISTS condition for untranslated questions
      // This is a complex condition:
      // We need questions where at least one question_text doesn't have a 
      // matching entry in question_text_topic_medium for the specified medium
      
      // Get all questions where there's at least one text NOT associated with this medium
      const skip = (page - 1) * page_size;
      const take = page_size;

      // First, get questions where at least one text doesn't have the specified medium
      const untranslatedQuestionIds = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT DISTINCT q.id
        FROM "Question" q
        JOIN "Question_Text" qt ON qt.question_id = q.id
        LEFT JOIN "Question_Text_Topic_Medium" qttm ON 
          qttm.question_text_id = qt.id AND
          qttm.instruction_medium_id = ${instruction_medium_id_param}
        WHERE qttm.id IS NULL
      `;

      // Extract just the IDs
      const questionIds = untranslatedQuestionIds.map(q => q.id);

      // Now add this condition to our where
      const finalWhereConditions = {
        ...whereConditions,
        id: {
          in: questionIds
        }
      };

      // Count total matching the criteria
      const totalCount = await this.prisma.question.count({
        where: finalWhereConditions
      });

      // Get the actual data with all the includes we need
      const orderBy: any = {};
      if (sort_by === 'created_at' || sort_by === 'updated_at') {
        orderBy[sort_by] = sort_order;
      } else if (sort_by === 'question_type_id') {
        orderBy.question_type_id = sort_order;
      } else if (sort_by === 'board_question') {
        orderBy.board_question = sort_order;
      } else {
        // Default sort
        orderBy.created_at = 'desc';
      }

      const questions = await this.prisma.question.findMany({
        where: finalWhereConditions,
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
                      topic: {
                        include: {
                          chapter: true
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
                include: {
                  chapter: true
                }
              }
            }
          }
        }
      });

      // Transform data for response
      const transformedQuestions = await this.transformQuestionResults(questions);

      return {
        data: transformedQuestions,
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

  // Create a complete question with all related data in a single transaction
  async createComplete(completeDto: CompleteQuestionDto) {
    try {
      const {
        question_type_id,
        board_question,
        question_text_data,
        question_topic_data,
        question_text_topic_medium_data
      } = completeDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Step 1: Validate all referenced entities
        // 1.1 Check if question type exists
        const questionType = await prisma.question_Type.findUnique({
          where: { id: question_type_id }
        });
        if (!questionType) {
          throw new NotFoundException(`Question type with ID ${question_type_id} not found`);
        }

        // 1.2 Check if topic exists
        const topic = await prisma.topic.findUnique({
          where: { id: question_topic_data.topic_id }
        });
        if (!topic) {
          throw new NotFoundException(`Topic with ID ${question_topic_data.topic_id} not found`);
        }

        // 1.3 Check if instruction medium exists (if provided)
        if (question_text_topic_medium_data) {
          const medium = await prisma.instruction_Medium.findUnique({
            where: { id: question_text_topic_medium_data.instruction_medium_id }
          });
          if (!medium) {
            throw new NotFoundException(`Instruction medium with ID ${question_text_topic_medium_data.instruction_medium_id} not found`);
          }
        }

        // 1.4 Check image if provided for question text
        if (question_text_data.image_id) {
          const image = await prisma.image.findUnique({
            where: { id: question_text_data.image_id }
          });
          if (!image) {
            throw new NotFoundException(`Image with ID ${question_text_data.image_id} not found`);
          }
        }

        // 1.5 Check images for MCQ options if provided
        if (question_text_data.mcq_options) {
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

        // 1.6 Check images for match pairs if provided
        if (question_text_data.match_pairs) {
          for (const pair of question_text_data.match_pairs) {
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
        }

        // Step 2: Create the question
        this.logger.log('Creating question with type and board status');
        const question = await prisma.question.create({
          data: {
            question_type_id,
            board_question
          }
        });

        // Step 3: Create the question topic association
        this.logger.log(`Creating question topic association for question ${question.id} with topic ${question_topic_data.topic_id}`);
        const questionTopic = await prisma.question_Topic.create({
          data: {
            question_id: question.id,
            topic_id: question_topic_data.topic_id
          }
        });

        // Step 4: Create the question text
        this.logger.log(`Creating question text for question ${question.id}`);
        const questionText = await prisma.question_Text.create({
          data: {
            question_id: question.id,
            question_text: question_text_data.question_text,
            ...(question_text_data.image_id ? { image_id: question_text_data.image_id } : {})
          }
        });

        // Step 5: Create MCQ options if provided
        if (question_text_data.mcq_options && question_text_data.mcq_options.length > 0) {
          this.logger.log(`Creating ${question_text_data.mcq_options.length} MCQ options for question text ${questionText.id}`);
          await Promise.all(question_text_data.mcq_options.map(option => 
            prisma.mcq_Option.create({
              data: {
                question_text_id: questionText.id,
                option_text: option.option_text,
                is_correct: option.is_correct ?? false,
                ...(option.image_id ? { image_id: option.image_id } : {})
              }
            })
          ));
        }

        // Step 6: Create match pairs if provided
        if (question_text_data.match_pairs && question_text_data.match_pairs.length > 0) {
          this.logger.log(`Creating ${question_text_data.match_pairs.length} match pairs for question text ${questionText.id}`);
          await Promise.all(question_text_data.match_pairs.map(pair => 
            prisma.match_Pair.create({
              data: {
                question_text_id: questionText.id,
                ...(pair.left_text ? { left_text: pair.left_text } : {}),
                ...(pair.right_text ? { right_text: pair.right_text } : {}),
                ...(pair.left_image_id ? { left_image_id: pair.left_image_id } : {}),
                ...(pair.right_image_id ? { right_image_id: pair.right_image_id } : {})
              }
            })
          ));
        }

        // Step 7: Create the question text topic medium association if provided
        if (question_text_topic_medium_data) {
          this.logger.log(`Creating question text topic medium association for question text ${questionText.id} and topic ${questionTopic.id}`);
          await prisma.question_Text_Topic_Medium.create({
            data: {
              question_text_id: questionText.id,
              question_topic_id: questionTopic.id,
              instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
              is_verified: false // Always set to false for new entries
            }
          });
        }

        // Step 8: Return the complete question with all relations
        this.logger.log(`Complete question creation successful, fetching final result for question ${question.id}`);
        const result = await prisma.question.findUnique({
          where: { id: question.id },
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

        // Transform the result to include presigned URLs for images
        return await this.transformSingleQuestion(result);
      });
    } catch (error) {
      this.logger.error('Failed to create complete question:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create complete question');
    }
  }

  async updateComplete(id: number, editDto: EditCompleteQuestionDto) {
    const { board_question, question_text_id, question_text_data, question_topic_data } = editDto;

    this.logger.log(`Updating complete question with ID ${id} and question text ID ${question_text_id}`);
    
    // We'll execute all operations in a transaction to ensure data consistency
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Validate that the question exists
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          question_texts: true,
          question_topics: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // 1.1 Validate that the specified question text exists and belongs to this question
      const questionText = await prisma.question_Text.findFirst({
        where: { 
          id: question_text_id,
          question_id: id
        }
      });

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${question_text_id} not found for question ${id}`);
      }

      // 2. Check if the question type allows MCQ options or match pairs
      const questionType = await prisma.question_Type.findUnique({
        where: { id: question.question_type_id }
      });

      if (!questionType) {
        throw new NotFoundException(`Question type with ID ${question.question_type_id} not found`);
      }

      // 2.1 Validate topic
      const topic = await prisma.topic.findUnique({
        where: { id: question_topic_data.topic_id }
      });

      if (!topic) {
        throw new NotFoundException(`Topic with ID ${question_topic_data.topic_id} not found`);
      }

      // 2.2 Check image if provided for question text
      if (question_text_data.image_id) {
        const image = await prisma.image.findUnique({
          where: { id: question_text_data.image_id }
        });
        if (!image) {
          throw new NotFoundException(`Image with ID ${question_text_data.image_id} not found`);
        }
      }

      // 2.3 Check images for MCQ options if provided
      if (question_text_data.mcq_options) {
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

      // 2.4 Check images for match pairs if provided
      if (question_text_data.match_pairs) {
        for (const pair of question_text_data.match_pairs) {
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
      }

      // 3. Update the question board status
      await prisma.question.update({
        where: { id },
        data: { board_question }
      });

      // 4. Update the topic association
      // First, find the existing topic association
      const existingTopic = await prisma.question_Topic.findFirst({
        where: { question_id: id }
      });

      if (existingTopic) {
        // Update existing topic association
        await prisma.question_Topic.update({
          where: { id: existingTopic.id },
          data: { topic_id: question_topic_data.topic_id }
        });
      } else {
        // Create new topic association if doesn't exist (shouldn't happen in normal flow)
        await prisma.question_Topic.create({
          data: {
            question_id: id,
            topic_id: question_topic_data.topic_id
          }
        });
      }

      // 5. Update the specified question text
      await prisma.question_Text.update({
        where: { id: question_text_id },
        data: {
          question_text: question_text_data.question_text,
          image_id: question_text_data.image_id
        }
      });

      // 6. Update MCQ options if provided
      if (question_text_data.mcq_options) {
        // Get existing MCQ options
        const existingOptions = await prisma.mcq_Option.findMany({
          where: { question_text_id: question_text_id }
        });

        // Create a map for easier lookup
        const existingOptionsMap = new Map(existingOptions.map(opt => [opt.id, opt]));
        
        // Keep track of processed options to identify which ones to delete
        const processedOptionIds = new Set();

        // Process each MCQ option
        for (const option of question_text_data.mcq_options) {
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
                question_text_id: question_text_id,
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

      // 7. Update match pairs if provided
      if (question_text_data.match_pairs) {
        // Get existing match pairs
        const existingPairs = await prisma.match_Pair.findMany({
          where: { question_text_id: question_text_id }
        });

        // Create a map for easier lookup
        const existingPairsMap = new Map(existingPairs.map(pair => [pair.id, pair]));
        
        // Keep track of processed pairs to identify which ones to delete
        const processedPairIds = new Set();

        // Process each match pair
        for (const pair of question_text_data.match_pairs) {
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
                question_text_id: question_text_id,
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

      // 8. Update verification status to false in Question_Text_Topic_Medium
      await prisma.question_Text_Topic_Medium.updateMany({
        where: { question_text_id: question_text_id },
        data: { is_verified: false }
      });

      // 9. Return the updated question with all related data
      return await prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_texts: {
            where: { id: question_text_id },
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
    });
  }

  async removeFromChapter(id: number, removeDto: RemoveQuestionFromChapterDto) {
    const { topic_id, instruction_medium_id } = removeDto;

    this.logger.log(`Removing question ID ${id} from topic ID ${topic_id}${instruction_medium_id ? ` with instruction medium ID ${instruction_medium_id}` : ' (all mediums)'}`);
    
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Validate that the question exists
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          question_topics: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // 2. Find the specific question_topic record for this topic
      const questionTopic = await prisma.question_Topic.findFirst({
        where: {
          question_id: id,
          topic_id: topic_id
        }
      });

      if (!questionTopic) {
        throw new NotFoundException(`Question with ID ${id} is not associated with topic ID ${topic_id}`);
      }

      // 3. Find all question_text records for this question
      const questionTexts = await prisma.question_Text.findMany({
        where: { question_id: id }
      });

      if (!questionTexts || questionTexts.length === 0) {
        throw new NotFoundException(`No question texts found for question ID ${id}`);
      }

      // 4. Find and delete all relevant question_text_topic_medium records
      const deletedAssociations = [];
      for (const questionText of questionTexts) {
        // Create the where condition based on whether instruction_medium_id is provided
        const whereCondition: Prisma.Question_Text_Topic_MediumWhereInput = {
          question_text_id: questionText.id,
          question_topic_id: questionTopic.id,
        };
        
        // Only add instruction_medium_id to the condition if it's provided
        if (instruction_medium_id !== undefined) {
          whereCondition.instruction_medium_id = instruction_medium_id;
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

      // 5. Check if there are any remaining question_text_topic_medium records for this question_topic
      const remainingAssociations = await prisma.question_Text_Topic_Medium.count({
        where: {
          question_topic_id: questionTopic.id
        }
      });

      // If no instruction_medium_id was specified or there are no remaining associations,
      // we should delete the question_topic
      const shouldDeleteQuestionTopic = instruction_medium_id === undefined || remainingAssociations === 0;

      if (shouldDeleteQuestionTopic) {
        // 6. Check if this is the last question_topic for this question
        const remainingTopics = await prisma.question_Topic.count({
          where: {
            question_id: id,
            NOT: {
              id: questionTopic.id // Exclude the current topic
            }
          }
        });

        // 7. If it's the last topic, delete the entire question
        if (remainingTopics === 0) {
          this.logger.log(`This is the last topic for question ID ${id}. Deleting the entire question.`);
          
          // Delete the question (will cascade delete all related records)
          await prisma.question.delete({
            where: { id }
          });

          return {
            message: `Question ID ${id} completely deleted as this was the last topic association`,
            removed_from_chapter: true,
            question_deleted: true,
            mediums_removed: deletedAssociations
          };
        } else {
          // 8. If it's not the last topic, just delete this question_topic
          await prisma.question_Topic.delete({
            where: { id: questionTopic.id }
          });

          return {
            message: `Question ID ${id} completely removed from topic ID ${topic_id}`,
            removed_from_chapter: true,
            topic_association_deleted: true,
            question_deleted: false,
            remaining_topic_count: remainingTopics,
            mediums_removed: deletedAssociations
          };
        }
      } else {
        // 9. If we only deleted specific medium associations but the topic still has others
        return {
          message: `Question ID ${id} partially removed from topic ID ${topic_id}`,
          removed_from_chapter: true,
          topic_association_deleted: false,
          medium_associations_deleted: true,
          question_deleted: false,
          mediums_removed: deletedAssociations,
          remaining_medium_associations: remainingAssociations
        };
      }
    });
  }
} 