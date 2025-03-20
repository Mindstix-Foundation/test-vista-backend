import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField } from './dto/question.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { AwsS3Service } from '../aws/aws-s3.service';

interface QuestionFilters {
  question_type_id?: number;
  is_verified?: boolean;
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
    
    const { image_url, ...imageData } = image;
    
    try {
      // Generate presigned URL with 1-hour expiration
      const presignedUrl = await this.awsS3Service.generatePresignedUrl(image_url, 3600);
      
      return {
        ...imageData,
        presigned_url: presignedUrl
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for image ${image.id}:`, error);
      // Return the image data without the presigned URL if generation fails
      return imageData;
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
    if (result.question_texts) {
      result.question_texts = await Promise.all(result.question_texts.map(async (text) => {
        const textResult = { ...text };
        
        // Transform main image
        if (textResult.image) {
          textResult.image = await this.transformImageData(textResult.image);
        }
        
        // Transform MCQ option images
        if (textResult.mcq_options) {
          textResult.mcq_options = await Promise.all(textResult.mcq_options.map(async (option) => {
            const optionResult = { ...option };
            if (optionResult.image) {
              optionResult.image = await this.transformImageData(optionResult.image);
            }
            return optionResult;
          }));
        }
        
        // Transform match pair images
        if (textResult.match_pairs) {
          textResult.match_pairs = await Promise.all(textResult.match_pairs.map(async (pair) => {
            const pairResult = { ...pair };
            if (pairResult.left_image) {
              pairResult.left_image = await this.transformImageData(pairResult.left_image);
            }
            if (pairResult.right_image) {
              pairResult.right_image = await this.transformImageData(pairResult.right_image);
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

      const skip = (page - 1) * page_size;
      
      // Build where clause
      const where: Prisma.QuestionWhereInput = {};
      
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
      
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
      }
      
      if (instruction_medium_id) {
        where.question_texts = {
          some: {
            instruction_medium_id: instruction_medium_id
          }
        };
      }
      
      // Add search capability if needed
      if (search) {
        where.question_texts = {
          some: {
            question_text: {
              contains: search,
              mode: 'insensitive'
            }
          }
        };
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.question.count({ where });
      
      // Build orderBy object
      const orderBy: any = {};
      
      // Make sure we're using a valid field for sorting
      // Valid question sort fields are checked against the QuestionSortField enum
      if (Object.values(QuestionSortField).includes(sort_by)) {
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionSortField.CREATED_AT] = sort_order;
        this.logger.warn(`Invalid sort field "${sort_by}" provided, defaulting to created_at`);
      }
      
      // Get paginated data with sorting
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
              }
            }
          },
          question_texts: {
            include: {
              instruction_medium: true,
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
      
      // Calculate total pages
      const total_pages = Math.ceil(total / page_size);
      
      return {
        data: transformedQuestions,
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
              }
            }
          },
          question_texts: {
            include: {
              instruction_medium: true,
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
              instruction_medium: true,
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
      
      // Build where clause
      const where: Prisma.QuestionWhereInput = {};
      
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
      
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
      }
      
      if (instruction_medium_id) {
        where.question_texts = {
          some: {
            instruction_medium_id: instruction_medium_id
          }
        };
      }
      
      // Add search capability if needed
      if (search) {
        where.question_texts = {
          some: {
            question_text: {
              contains: search,
              mode: 'insensitive'
            }
          }
        };
      }
      
      // Build orderBy object
      const orderBy: any = {};
      
      // Make sure we're using a valid field for sorting
      if (Object.values(QuestionSortField).includes(sort_by)) {
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionSortField.CREATED_AT] = sort_order;
        this.logger.warn(`Invalid sort field "${sort_by}" provided, defaulting to created_at`);
      }
      
      // Get data with sorting but without pagination
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
              }
            }
          },
          question_texts: {
            include: {
              instruction_medium: true,
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
      return await this.transformQuestionResults(questions);
    } catch (error) {
      this.logger.error('Failed to fetch questions without pagination:', error);
      throw new InternalServerErrorException('Failed to fetch questions without pagination');
    }
  }

  async findUntranslatedQuestions(mediumId: number, filters: QuestionFilters) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        is_verified,
        page = 1,
        page_size = 10,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search
      } = filters;

      const skip = (page - 1) * page_size;
      
      // Build where clause
      const where: Prisma.QuestionWhereInput = {
        // The question must have at least one question_text entry (in any medium)
        question_texts: {
          some: {}
        },
        // AND the question must NOT have a question_text in the specified medium
        NOT: {
          question_texts: {
            some: {
              instruction_medium_id: mediumId
            }
          }
        }
      };
      
      // Add the other filters
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
      
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
      }
      
      // Add search capability if needed
      if (search) {
        where.AND = [
          {
            question_texts: {
              some: {
                question_text: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          }
        ];
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.question.count({ where });
      
      // Build orderBy object
      const orderBy: any = {};
      
      // Make sure we're using a valid field for sorting
      // Valid question sort fields are checked against the QuestionSortField enum
      if (Object.values(QuestionSortField).includes(sort_by)) {
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionSortField.CREATED_AT] = sort_order;
        this.logger.warn(`Invalid sort field "${sort_by}" provided, defaulting to created_at`);
      }
      
      // Get paginated data with sorting
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
              }
            }
          },
          question_texts: {
            include: {
              instruction_medium: true,
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
      
      // Calculate total pages
      const total_pages = Math.ceil(total / page_size);
      
      return {
        data: transformedQuestions,
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