import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField } from './dto/question.dto';
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
        is_verified,
        instruction_medium_id,
        page = 1, 
        page_size = 10, 
        sort_by = QuestionSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      this.logger.log(`Question findAll called with params:
        - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
        - is_verified: ${is_verified} (${typeof is_verified})
        - other filters: question_type_id=${question_type_id}, topic_id=${topic_id}, chapter_id=${chapter_id}
      `);
      
      const skip = (page - 1) * page_size;
      
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
      
      // Handle filtering by is_verified using the junction table
      if (is_verified !== undefined) {
        this.logger.log(`Filtering questions by is_verified: ${is_verified}`);
        
        andConditions.push({
          question_topics: {
            some: {
              question_text_topics: {
                some: {
                  is_verified: is_verified
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
      
      // Get total count for pagination metadata
      const total = await this.prisma.question.count({ where });
      this.logger.log(`Found ${total} questions matching filters`);
      
      // Build orderBy object
      const orderBy: Prisma.QuestionOrderByWithRelationInput = {};
      orderBy[sort_by as keyof Prisma.QuestionOrderByWithRelationInput] = sort_order;
      
      // Get paginated data with sorting
      this.logger.log(`Fetching questions with pagination (page ${page}, size ${page_size})`);
      const questions = await this.prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: page_size,
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
        if ((instruction_medium_id !== undefined || is_verified !== undefined) && 
            (!question.question_texts || question.question_texts.length === 0)) {
          return false;
        }
        return true;
      });
      
      // Calculate total pages
      const total_pages = Math.ceil(total / page_size);
      
      return {
        data: filteredQuestions,
        meta: {
          total,
          page,
          page_size,
          total_pages,
          sort_by,
          sort_order
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch questions:', error);
      throw new InternalServerErrorException('Failed to fetch questions');
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
        is_verified,
        instruction_medium_id,
        sort_by = QuestionSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      this.logger.log(`Question findAllWithoutPagination called with params:
        - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
        - is_verified: ${is_verified} (${typeof is_verified})
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
      
      // Handle filtering by is_verified using the junction table
      if (is_verified !== undefined) {
        this.logger.log(`Filtering questions by is_verified: ${is_verified}`);
        
        andConditions.push({
          question_topics: {
            some: {
              question_text_topics: {
                some: {
                  is_verified: is_verified
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
        if ((instruction_medium_id !== undefined || is_verified !== undefined) && 
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
        topic_id,
        chapter_id,
        question_type_id,
        is_verified,
        page = 1,
        page_size = 10,
        search
      } = filters;

      const skip = (page - 1) * page_size;

      // Convert to number if it's a string
      const instruction_medium_id = typeof instruction_medium_id_param === 'string' 
        ? parseInt(instruction_medium_id_param, 10) 
        : instruction_medium_id_param;

      this.logger.log(`Finding untranslated questions for medium: ${instruction_medium_id}`);

      // Build the base where clause
      const whereConditions = [];
      
      // Add basic question filters
      if (topic_id) {
        whereConditions.push({ 
          question_topics: { 
            some: { topic_id: parseInt(String(topic_id), 10) } 
          } 
        });
      }
      
      if (chapter_id) {
        whereConditions.push({ 
          question_topics: { 
            some: { 
              topic: { chapter_id: parseInt(String(chapter_id), 10) } 
            } 
          } 
        });
      }
      
      if (question_type_id) {
        whereConditions.push({ 
          question_type_id: parseInt(String(question_type_id), 10) 
        });
      }
      
      // Add search capability if needed
      if (search) {
        whereConditions.push({
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
      
      // Ensure the question has at least one question_text entry
      whereConditions.push({ question_texts: { some: {} } });
      
      // But does NOT have a question_text in the specified medium
      whereConditions.push({
        NOT: {
          question_topics: {
            some: {
              question_text_topics: {
                some: {
                  instruction_medium: {
                    id: instruction_medium_id
                  }
                }
              }
            }
          }
        }
      });

      // Add filter for verified question text topics if specified
      if (is_verified !== undefined) {
        whereConditions.push({
          question_topics: {
            some: {
              question_text_topics: {
                some: {
                  is_verified: is_verified
                }
              }
            }
          }
        });
      }

      // Define the final where clause
      const where: Prisma.QuestionWhereInput = {
        AND: whereConditions
      };

      // Get total count for pagination metadata
      const total = await this.prisma.question.count({ where });
      this.logger.log(`Found ${total} untranslated questions for medium ID ${instruction_medium_id}`);

      // Build orderBy object
      const orderBy: Prisma.QuestionOrderByWithRelationInput = {};
      orderBy[sort_by as keyof Prisma.QuestionOrderByWithRelationInput] = sort_order;

      // Get paginated data with sorting
      this.logger.log(`Fetching untranslated questions with pagination (page ${page}, size ${page_size})`);
      const questions = await this.prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: page_size,
        include: {
          question_type: true,
          question_topics: {
            include: {
              topic: true,
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

      this.logger.log(`Transforming ${questions.length} untranslated questions to include presigned URLs`);
      // Transform questions to include presigned URLs
      const transformedQuestions = await this.transformQuestionResults(questions);
      
      // Filter out questions with empty question_texts arrays when filters are applied
      const filteredQuestions = transformedQuestions.filter(question => {
        // Only filter out empty arrays if we're applying text-specific filters
        if (is_verified !== undefined && 
            (!question.question_texts || question.question_texts.length === 0)) {
          return false;
        }
        return true;
      });
      
      // Calculate total pages
      const total_pages = Math.ceil(total / page_size);
      
      return {
        data: filteredQuestions,
        meta: {
          total,
          page,
          page_size,
          total_pages,
          sort_by,
          sort_order
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch untranslated questions:', error);
      throw new InternalServerErrorException('Failed to fetch untranslated questions');
    }
  }
} 