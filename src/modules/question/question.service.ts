import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField, ComplexCreateQuestionDto, CompleteQuestionDto, EditCompleteQuestionDto, RemoveQuestionFromChapterDto, AddTranslationDto } from './dto/question.dto';
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
        search,
        is_verified
      } = filters;
      
      // Define where conditions for main query
      const whereConditions: any = {};

      // Basic filters directly on the Question model
      if (question_type_id !== undefined) {
        whereConditions.question_type_id = question_type_id;
      }

      if (board_question !== undefined) {
        whereConditions.board_question = board_question;
      }
      
      // Handle topic-related filters - we need to properly combine topic_id and chapter_id
      if (topic_id !== undefined || chapter_id !== undefined) {
        whereConditions.question_topics = {
          some: {}
        };
        
        // Add topic_id filter if specified
        if (topic_id !== undefined) {
          whereConditions.question_topics.some.topic_id = topic_id;
        }
        
        // Add chapter_id filter if specified
        if (chapter_id !== undefined) {
          whereConditions.question_topics.some.topic = {
            chapter_id
          };
        }
      }
      
      // Handle question_texts filters - properly combine instruction_medium_id, search, and is_verified
      const questionTextFilters = [];
      
      // Instruction medium filter
      if (instruction_medium_id !== undefined) {
        questionTextFilters.push({
              question_text_topics: {
                some: {
              instruction_medium_id
            }
          }
        });
      }
      
      // Verification status filter
      if (is_verified !== undefined) {
        questionTextFilters.push({
              question_text_topics: {
                some: {
              is_verified
            }
          }
        });
      }
      
      // Search filter
      if (search) {
        questionTextFilters.push({
              question_text: {
                contains: search,
                mode: 'insensitive'
          }
        });
      }
      
      // If we have any question_texts filters, add them to the where conditions
      if (questionTextFilters.length > 0) {
        // If we have multiple filters, we need to combine them with AND logic
        if (questionTextFilters.length === 1) {
          whereConditions.question_texts = {
            some: questionTextFilters[0]
          };
        } else {
          // For multiple filters, we construct an AND condition where EACH filter must be true for at least one question_text
          whereConditions.question_texts = {
            some: {
              AND: questionTextFilters
            }
          };
        }
      }

      // Log the constructed where conditions for debugging
      this.logger.log(`Constructed where conditions: ${JSON.stringify(whereConditions)}`);

      // Handle sorting: map sort_by to actual DB field
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT) {
        // Sort by question_text's created_at field
        orderBy.created_at = sort_order;
      } else if (sort_by === QuestionSortField.UPDATED_AT) {
        // Sort by question_text's updated_at field
        orderBy.updated_at = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        // Sort by question type - first by type name through the relation
        orderBy.question_type = {
          type_name: sort_order
        };
      } else if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by first question text in question_texts
        orderBy.created_at = sort_order; // Fallback to sort by creation date
      } else {
        // Default sort by creation date of question
        orderBy.created_at = SortOrder.DESC;
      }

      // Log the order by clause for debugging
      this.logger.log(`Sorting with: ${JSON.stringify(orderBy)}`);

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
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT) {
        // Sort by question_text's created_at field
        orderBy.created_at = sort_order;
      } else if (sort_by === QuestionSortField.UPDATED_AT) {
        // Sort by question_text's updated_at field
        orderBy.updated_at = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        // Sort by question type - first by type name through the relation
        orderBy.question_type = {
          type_name: sort_order
        };
      } else if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by first question text in question_texts
        orderBy.created_at = sort_order; // Fallback to sort by creation date
      } else {
        // Default sort by creation date of question
        orderBy.created_at = SortOrder.DESC;
      }
      
      // Log the order by clause for debugging
      this.logger.log(`Sorting without pagination with: ${JSON.stringify(orderBy)}`);

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
        WHERE EXISTS (
          SELECT 1 FROM "Question_Text" qt 
          WHERE qt.question_id = q.id
          AND NOT EXISTS (
            SELECT 1 FROM "Question_Text_Topic_Medium" qttm 
            WHERE qttm.question_text_id = qt.id 
            AND qttm.instruction_medium_id = ${instruction_medium_id_param}
          )
        )
      `;

      // Extract just the IDs
      const questionIds = untranslatedQuestionIds.map(q => q.id);
      
      // Add diagnostic logging
      this.logger.log(`Found ${questionIds.length} questions with untranslated texts for medium ${instruction_medium_id_param}`);
      if (questionIds.length === 0) {
        this.logger.warn(`No untranslated questions found for medium ${instruction_medium_id_param} - check if the medium exists and has questions`);
      }

      // Now add this condition to our where
      const finalWhereConditions = {
        ...whereConditions,
        id: {
          in: questionIds
        }
      };
      
      // Log the final where conditions for debugging
      this.logger.log(`Final where conditions: ${JSON.stringify(finalWhereConditions)}`);

      // Count total matching the criteria
      const totalCount = await this.prisma.question.count({
        where: finalWhereConditions
      });

      // Get the actual data with all the includes we need
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT) {
        // Sort by question_text's created_at field
        orderBy.created_at = sort_order;
      } else if (sort_by === QuestionSortField.UPDATED_AT) {
        // Sort by question_text's updated_at field
        orderBy.updated_at = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        // Sort by question type - first by type name through the relation
        orderBy.question_type = {
          type_name: sort_order
        };
      } else if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by first question text in question_texts
        orderBy.created_at = sort_order; // Fallback to sort by creation date
      } else {
        // Default sort by creation date of question
        orderBy.created_at = SortOrder.DESC;
      }
      
      // Log the order by clause for debugging
      this.logger.log(`Sorting untranslated questions with: ${JSON.stringify(orderBy)}`);

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
      /**
       * Image Comparison Strategy for Duplicate Question Detection:
       * 
       * We identify duplicate questions based on the following criteria:
       * 1. Same question text
       * 2. Same question type 
       * 3. Same image situation
       * 
       * For image comparison (point #3), we use a simplified file hash approach:
       * - If one question has an image and the other doesn't, they're treated as different questions
       * - If both have images but with different image_ids, they're treated as different questions
       * - If both have the same image_id or both have no images, the image situation is considered identical
       * 
       * This approach is efficient because:
       * - It doesn't require calculating cryptographic hashes of image files
       * - It leverages the existing uniqueness of image_ids in the database
       * - It allows questions to be differentiated based on visual content
       * - It supports the educational use case where the same text might need different visual explanations
       */
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

        // NEW STEP: Check if a question text with the same content already exists
        this.logger.log(`Checking if question text "${question_text_data.question_text.substring(0, 50)}..." already exists`);
        const existingQuestionText = await prisma.question_Text.findFirst({
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

        if (existingQuestionText) {
          this.logger.log(`Found existing question text with ID ${existingQuestionText.id}`);
          
          // Check if question types are different
          if (existingQuestionText.question.question_type_id !== question_type_id) {
            this.logger.log(`Question types are different (existing: ${existingQuestionText.question.question_type_id}, new: ${question_type_id}). Creating a new question.`);
            // Skip to creating a new question as different question type means different question
            // No early return here - continue to create a new question below
          } else {
            // Check if images are different - if one has image and other doesn't, or they have different images
            const existingHasImage = existingQuestionText.image_id !== null;
            const newHasImage = question_text_data.image_id !== null;
            
            let differentImageSituation = false;
            
            // Implementation of the file hash comparison approach (Option 3):
            // 1. If one has an image and the other doesn't, they're considered different questions
            // 2. If both have images but with different image_ids, they're considered different questions
            // This approach is simpler and more efficient than generating and comparing actual file hashes
            // since we're relying on unique image_ids which are already guaranteed to be unique
            
            // Case 1: Different image presence (one has image, other doesn't)
            if (existingHasImage !== newHasImage) {
              this.logger.log(`Image presence differs (existing: ${existingHasImage ? 'has image' : 'no image'}, new: ${newHasImage ? 'has image' : 'no image'}). Will create a new question.`);
              differentImageSituation = true;
            } 
            // Case 2: Both have images but they're different
            else if (existingHasImage && newHasImage && existingQuestionText.image_id !== question_text_data.image_id) {
              this.logger.log(`Both have images but they are different (existing: ${existingQuestionText.image_id}, new: ${question_text_data.image_id}). Will create a new question.`);
              differentImageSituation = true;
            }
            
            // If we have different image situation, create a new question
            if (differentImageSituation) {
              this.logger.log('Creating new question due to different image situation');
              // Continue to the creation logic below (no early return)
            }
            // Case 3: Identical text, question type, and image situation
            else {
              // Question types are the same, check if question is associated with the requested topic
              const existingTopicAssociation = existingQuestionText.question.question_topics.length > 0;
              
              if (existingTopicAssociation) {
                this.logger.log(`Question ID ${existingQuestionText.question_id} is already associated with topic ID ${question_topic_data.topic_id}`);
                
                // If medium is specified, check medium association
                if (question_text_topic_medium_data) {
                  const existingMediumAssociation = existingQuestionText.question_text_topics.some(
                    textTopic => textTopic.instruction_medium_id === question_text_topic_medium_data.instruction_medium_id
                  );
                  
                  if (existingMediumAssociation) {
                    // Question with same text already exists for this topic and medium
                    const mediumInfo = await prisma.instruction_Medium.findUnique({
                      where: { id: question_text_topic_medium_data.instruction_medium_id },
                      select: { instruction_medium: true }
                    });
                    
                    const topicName = topic.name;
                    
                    return {
                      message: `Question with the same text already exists for topic "${topicName}" and medium "${mediumInfo?.instruction_medium}"`,
                      existing_question: await this.transformSingleQuestion(existingQuestionText.question),
                      is_duplicate: true
                    };
                  }
                  
                  // Question exists for this topic but not for this medium - add the medium association
                  this.logger.log(`Creating new medium association for existing question text ${existingQuestionText.id}`);
                  
                  // Find the question topic association
                  const questionTopic = existingQuestionText.question.question_topics[0];
                  
                  // Create the question text topic medium association
                  await prisma.question_Text_Topic_Medium.create({
                    data: {
                      question_text_id: existingQuestionText.id,
                      question_topic_id: questionTopic.id,
                      instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
                      is_verified: false
                    }
                  });
                  
                  // Return the updated question
                  const result = await prisma.question.findUnique({
                    where: { id: existingQuestionText.question_id },
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
                  
                  return {
                    message: `Added new medium association to existing question`,
                    ...await this.transformSingleQuestion(result),
                    reused_existing_question: true
                  };
                } else {
                  // No medium specified but question already exists for this topic
                  return {
                    message: `Question with the same text already exists for topic "${topic.name}"`,
                    existing_question: await this.transformSingleQuestion(existingQuestionText.question),
                    is_duplicate: true
                  };
                }
              } else {
                // Question text exists but not for this topic - create the topic association
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
                  this.logger.log(`Creating medium association for existing question ${existingQuestionText.question_id}`);
                  await prisma.question_Text_Topic_Medium.create({
                    data: {
                      question_text_id: existingQuestionText.id,
                      question_topic_id: questionTopic.id,
                      instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
                      is_verified: false
                    }
                  });
                }
                
                // Return the updated question
                const result = await prisma.question.findUnique({
                  where: { id: existingQuestionText.question_id },
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
                
                return {
                  message: `Added new topic association to existing question`,
                  ...await this.transformSingleQuestion(result),
                  reused_existing_question: true
                };
              }
            }
          }
        }

        // If no existing question text found, create a new question
        this.logger.log(`${existingQuestionText && existingQuestionText.question.question_type_id !== question_type_id 
          ? 'Creating new question because question types are different' 
          : 'No existing question text found, creating new question'}`);
        
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
        const resultWithUrls = await this.transformSingleQuestion(result);
        
        // Add message if this was created due to different question type
        if (existingQuestionText && existingQuestionText.question.question_type_id !== question_type_id) {
          return {
            ...resultWithUrls,
            message: `Created new question with same text but different question type (${questionType.type_name}) than existing question`,
            different_question_type: true
          };
        }
        
        return resultWithUrls;
      });
    } catch (error) {
      this.logger.error('Failed to create complete question:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create complete question: ' + error.message);
    }
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

      // NEW STEP: Check if a question text with the same content already exists
      // but exclude the current question text from the search
      this.logger.log(`Checking if question text "${question_text_data.question_text.substring(0, 50)}..." already exists elsewhere`);
      const existingQuestionText = await prisma.question_Text.findFirst({
        where: {
          question_text: question_text_data.question_text,
          id: { not: question_text_id } // Exclude the current text being edited
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
          mcq_options: true,
          match_pairs: true,
          question_text_topics: {
            where: {
              question_topic: {
                topic_id: question_topic_data.topic_id
              }
            }
          }
        }
      });

      if (existingQuestionText) {
        this.logger.log(`Found existing question text with ID ${existingQuestionText.id} containing the same content`);
        
        // Check if the existing question text is similar enough to reuse (same MCQ options and match pairs structure)
        let canReuseText = true;
        let reusableTextExplanation = "";
        
        // Implement the image comparison approach (similar to createComplete method)
        // Check if the current image situation is different from the existing text
        const currentText = await prisma.question_Text.findUnique({
          where: { id: question_text_id },
          select: { image_id: true }
        });
        
        const existingHasImage = existingQuestionText.image_id !== null;
        const currentHasImage = currentText.image_id !== null;
        const newHasImage = question_text_data.image_id !== null;
        
        let differentImageSituation = false;
        
        // Implementation of the file hash comparison approach (Option 3):
        // 1. If one has an image and the other doesn't, they're considered different questions
        // 2. If both have images but with different image_ids, they're considered different questions
        
        // Case 1: Different image presence
        if (existingHasImage !== newHasImage) {
          this.logger.log(`Image presence differs (existing: ${existingHasImage ? 'has image' : 'no image'}, new: ${newHasImage ? 'has image' : 'no image'}). Cannot reuse text.`);
          differentImageSituation = true;
        } 
        // Case 2: Both have images but they're different
        else if (existingHasImage && newHasImage && existingQuestionText.image_id !== question_text_data.image_id) {
          this.logger.log(`Both have images but they are different (existing: ${existingQuestionText.image_id}, new: ${question_text_data.image_id}). Cannot reuse text.`);
          differentImageSituation = true;
        }
        
        if (differentImageSituation) {
          // If the images are different, don't reuse the text
          this.logger.log(`Cannot reuse question text due to different image situation.`);
          canReuseText = false;
          reusableTextExplanation = "Image situation differs";
        }
        
        // Compare MCQ options count if both have them
        if (
          (existingQuestionText.mcq_options?.length > 0 && (!question_text_data.mcq_options || question_text_data.mcq_options.length === 0)) ||
          (!existingQuestionText.mcq_options?.length && question_text_data.mcq_options?.length > 0)
        ) {
          canReuseText = false;
          reusableTextExplanation = "MCQ options structure differs";
        }
        
        // Compare match pairs count if both have them
        if (
          (existingQuestionText.match_pairs?.length > 0 && (!question_text_data.match_pairs || question_text_data.match_pairs.length === 0)) ||
          (!existingQuestionText.match_pairs?.length && question_text_data.match_pairs?.length > 0)
        ) {
          canReuseText = false;
          reusableTextExplanation = "Match pairs structure differs";
        }
        
        // Check if the existing text is associated with this topic
        const existingTopicAssociation = existingQuestionText.question.question_topics.length > 0;
        
        if (canReuseText) {
          this.logger.log(`Existing question text can be reused with ID ${existingQuestionText.id}`);
          
          // First, find all the question_text_topic_medium entries for the current text
          const currentTextTopicMediums = await prisma.question_Text_Topic_Medium.findMany({
            where: { question_text_id: question_text_id }
          });
          
          // Get the question topic id for the target topic
          let targetQuestionTopicId = existingTopic.id;
          
          if (existingTopic.topic_id !== question_topic_data.topic_id) {
            // If the topic has changed, find or create the appropriate question topic record
            const existingQuestionTopic = await prisma.question_Topic.findFirst({
              where: {
                question_id: existingQuestionText.question_id,
                topic_id: question_topic_data.topic_id
              }
            });
            
            if (existingQuestionTopic) {
              targetQuestionTopicId = existingQuestionTopic.id;
            } else {
              // Create new question topic association if needed
              const newQuestionTopic = await prisma.question_Topic.create({
                data: {
                  question_id: existingQuestionText.question_id,
                  topic_id: question_topic_data.topic_id
                }
              });
              targetQuestionTopicId = newQuestionTopic.id;
            }
          }
          
          // For each current text-topic-medium, create or update corresponding entries for the existing text
          for (const textTopicMedium of currentTextTopicMediums) {
            // Check if this association already exists for the existing text
            const existingAssociation = await prisma.question_Text_Topic_Medium.findFirst({
              where: {
                question_text_id: existingQuestionText.id,
                question_topic_id: targetQuestionTopicId,
                instruction_medium_id: textTopicMedium.instruction_medium_id
              }
            });
            
            if (!existingAssociation) {
              // Create a new association for the existing text
              await prisma.question_Text_Topic_Medium.create({
                data: {
                  question_text_id: existingQuestionText.id,
                  question_topic_id: targetQuestionTopicId,
                  instruction_medium_id: textTopicMedium.instruction_medium_id,
                  is_verified: false // Always set to false for new entries
                }
              });
            }
          }
          
          // Now we can safely delete the old text since we've migrated all associations
          // First, delete all question_text_topic_medium entries for the old text
          await prisma.question_Text_Topic_Medium.deleteMany({
            where: { question_text_id: question_text_id }
          });
          
          // Delete MCQ options for the old text
          await prisma.mcq_Option.deleteMany({
            where: { question_text_id: question_text_id }
          });
          
          // Delete match pairs for the old text
          await prisma.match_Pair.deleteMany({
            where: { question_text_id: question_text_id }
          });
          
          // Finally, delete the old question text
          await prisma.question_Text.delete({
            where: { id: question_text_id }
          });
          
          // Return the question with the reused text
          const updatedQuestion = await prisma.question.findUnique({
            where: { id },
            include: {
              question_type: true,
              question_texts: {
                where: { id: existingQuestionText.id },
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
          
          return {
            message: `Reused existing question text to reduce redundancy`,
            ...await this.transformSingleQuestion(updatedQuestion),
            reused_existing_text: true
          };
        } else {
          this.logger.log(`Existing question text found but cannot be reused: ${reusableTextExplanation}`);
        }
      }

      // If no reusable text was found, proceed with normal update
      this.logger.log(`No reusable question text found, proceeding with normal update`);

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
      const updatedQuestion = await prisma.question.findUnique({
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
      
      return await this.transformSingleQuestion(updatedQuestion);
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
          
          // Collect all images that need to be deleted from S3
          const imagesToDelete = await this.collectImagesToDelete(question);
          
          // Delete the question (will cascade delete all related records)
          await prisma.question.delete({
            where: { id }
          });
          
          // After the database transaction succeeds, delete the images from S3
          if (imagesToDelete.length > 0) {
            this.logger.log(`Deleting ${imagesToDelete.length} images from S3 bucket for question ${id}`);
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

          return {
            message: `Question ID ${id} completely deleted as this was the last topic association`,
            removed_from_chapter: true,
            question_deleted: true,
            mediums_removed: deletedAssociations,
            images_deleted: imagesToDelete.length
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

  // Helper method to collect all image URLs for a question that should be deleted
  private async collectImagesToDelete(question): Promise<string[]> {
    const imageUrls = new Set<string>();
    
    for (const questionText of question.question_texts) {
      // Add question text image if it exists
      if (questionText.image?.image_url) {
        imageUrls.add(questionText.image.image_url);
      }
      
      // Add MCQ option images
      if (questionText.mcq_options) {
        for (const option of questionText.mcq_options) {
          if (option.image?.image_url) {
            imageUrls.add(option.image.image_url);
          }
        }
      }
      
      // Add match pair images (left and right)
      if (questionText.match_pairs) {
        for (const pair of questionText.match_pairs) {
          if (pair.left_image?.image_url) {
            imageUrls.add(pair.left_image.image_url);
          }
          if (pair.right_image?.image_url) {
            imageUrls.add(pair.right_image.image_url);
          }
        }
      }
    }
    
    // Check if these images are used by other questions before deleting
    const imageUrlsArray = Array.from(imageUrls);
    const safeToDelete: string[] = [];
    
    // For each image URL, check if it's used by other questions
    for (const imageUrl of imageUrlsArray) {
      // Extract image ID from the image object
      const imageId = question.question_texts.flatMap(qt => {
        const ids = [];
        if (qt.image?.image_url === imageUrl) ids.push(qt.image.id);
        
        if (qt.mcq_options) {
          qt.mcq_options.forEach(opt => {
            if (opt.image?.image_url === imageUrl) ids.push(opt.image.id);
          });
        }
        
        if (qt.match_pairs) {
          qt.match_pairs.forEach(pair => {
            if (pair.left_image?.image_url === imageUrl) ids.push(pair.left_image.id);
            if (pair.right_image?.image_url === imageUrl) ids.push(pair.right_image.id);
          });
        }
        
        return ids;
      })[0];
      
      if (!imageId) continue;
      
      // Check if the image is used by other questions
      const usageCount = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM (
          SELECT image_id FROM Question_Text WHERE image_id = ${imageId} AND question_id != ${question.id}
          UNION ALL
          SELECT image_id FROM MCQ_Option WHERE image_id = ${imageId} AND question_text_id NOT IN (
            SELECT id FROM Question_Text WHERE question_id = ${question.id}
          )
          UNION ALL
          SELECT left_image_id FROM Match_Pair WHERE left_image_id = ${imageId} AND question_text_id NOT IN (
            SELECT id FROM Question_Text WHERE question_id = ${question.id}
          )
          UNION ALL
          SELECT right_image_id FROM Match_Pair WHERE right_image_id = ${imageId} AND question_text_id NOT IN (
            SELECT id FROM Question_Text WHERE question_id = ${question.id}
          )
        ) as usage
      `;
      
      // If the image is not used by any other questions, it's safe to delete
      if (usageCount[0].count === 0) {
        safeToDelete.push(imageUrl);
      }
    }
    
    this.logger.log(`Found ${safeToDelete.length} images that can be safely deleted for question ${question.id}`);
    return safeToDelete;
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
    
    // Simplified question object with only required fields
    return {
      id: question.id,
      board_question: question.board_question,
      question_type: question.question_type ? {
        id: question.question_type.id,
        type_name: question.question_type.type_name
      } : null,
      question_texts: (question.question_texts || []).map(text => ({
        id: text.id,
        question_id: text.question_id,
        image_id: text.image_id,
        question_text: text.question_text,
        image: text.image,
        mcq_options: text.mcq_options || [],
        match_pairs: text.match_pairs || [],
        topic: text.question_text_topics && text.question_text_topics.length > 0 
          ? {
              id: text.question_text_topics[0].question_topic?.topic?.id,
              chapter_id: text.question_text_topics[0].question_topic?.topic?.chapter_id,
              name: text.question_text_topics[0].question_topic?.topic?.name
            }
          : null
      }))
    };
  }

  /**
   * Add a translation for an existing question
   * @param questionId The ID of the question to translate
   * @param translationDto The translation data
   * @returns The created translation details
   */
  async addTranslation(questionId: number, translationDto: AddTranslationDto) {
    // Get the question to translate
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

    // Verify if the question has at least one verified text in another medium
    const hasVerifiedText = question.question_texts.some(text => 
      text.question_text_topics && 
      text.question_text_topics.some(qttm => qttm.is_verified)
    );

    if (!hasVerifiedText) {
      throw new BadRequestException(`Question with ID ${questionId} does not have any verified text. Only verified questions can be translated.`);
    }

    // Check if an existing translation for this medium already exists
    const existingTranslation = question.question_texts.some(text => 
      text.question_text_topics && 
      text.question_text_topics.some(
        qttm => qttm.instruction_medium_id === translationDto.instruction_medium_id
      )
    );

    if (existingTranslation) {
      throw new ConflictException(`Translation for question ID ${questionId} in medium ID ${translationDto.instruction_medium_id} already exists`);
    }

    // Check for image consistency - enforcing that translation follows the same image pattern as source
    const sourceHasImage = question.question_texts.some(text => text.image_id !== null);
    const translationHasImage = translationDto.image_id !== undefined && translationDto.image_id !== null;

    if (sourceHasImage && !translationHasImage) {
      throw new BadRequestException('Original question has an image, but translation does not include an image_id. Please provide an image for consistency.');
    }

    if (!sourceHasImage && translationHasImage) {
      throw new BadRequestException('Original question does not have an image, but translation includes an image_id. Please remove the image_id for consistency.');
    }

    // Get the question type
    const questionType = question.question_type;

    // For MCQ questions, ensure mcq_options are provided
    if (questionType.type_name.toLowerCase().includes('multiple choice') && 
        (!translationDto.mcq_options || translationDto.mcq_options.length === 0)) {
      throw new BadRequestException('MCQ options must be provided for Multiple Choice question types');
    }

    // For matching questions, ensure match_pairs are provided
    if (questionType.type_name.toLowerCase().includes('match') && 
        (!translationDto.match_pairs || translationDto.match_pairs.length === 0)) {
      throw new BadRequestException('Match pairs must be provided for Matching question types');
    }

    // Use transaction to ensure data consistency
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Create a new question_text entry
      const newQuestionText = await prisma.question_Text.create({
        data: {
          question_id: questionId,
          question_text: translationDto.question_text,
          image_id: translationDto.image_id || null
        }
      });

      // 2. If it's an MCQ question, create the options
      if (translationDto.mcq_options && translationDto.mcq_options.length > 0) {
        await Promise.all(
          translationDto.mcq_options.map(option => 
            prisma.mcq_Option.create({
              data: {
                question_text_id: newQuestionText.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
                image_id: option.image_id || null
              }
            })
          )
        );
      }

      // 3. If it's a matching question, create the pairs
      if (translationDto.match_pairs && translationDto.match_pairs.length > 0) {
        await Promise.all(
          translationDto.match_pairs.map(pair => 
            prisma.match_Pair.create({
              data: {
                question_text_id: newQuestionText.id,
                left_text: pair.left_text || null,
                right_text: pair.right_text || null,
                left_image_id: pair.left_image_id || null,
                right_image_id: pair.right_image_id || null
              }
            })
          )
        );
      }

      // 4. For each question topic, create a question_text_topic_medium relation
      // Find all topic IDs associated with this question
      const questionTopics = await prisma.question_Topic.findMany({
        where: { question_id: questionId }
      });

      // Create associations for each topic with the new medium
      for (const questionTopic of questionTopics) {
        await prisma.question_Text_Topic_Medium.create({
          data: {
            question_text_id: newQuestionText.id,
            question_topic_id: questionTopic.id,
            instruction_medium_id: translationDto.instruction_medium_id,
            is_verified: false // Always set to false for new translations
          }
        });
      }

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
    });

    return result;
  }
} 