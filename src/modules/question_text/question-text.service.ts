import { Injectable, Logger, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateQuestionTextDto, 
  UpdateQuestionTextDto, 
  QuestionTextFilterDto, 
  QuestionTextSortField,
  UpdateMcqOptionDto,
  UpdateMatchPairDto
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

      // Check if the question exists
      const question = await this.prisma.question.findUnique({
        where: { id: question_id },
        include: {
          question_topics: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${question_id} not found`);
      }

      // Check if image exists if image_id is provided
      if (image_id !== undefined && image_id !== null) {
        const image = await this.prisma.image.findUnique({
          where: { id: image_id }
        });

        if (!image) {
          throw new NotFoundException(`Image with ID ${image_id} not found`);
        }
      }

      // Create the question text and related items
      return await this.prisma.$transaction(async (prisma) => {
        // Create the question text with image_id only if it's provided
        const newQuestionText = await prisma.question_Text.create({
          data: {
            question_id,
            question_text,
            ...(image_id !== undefined && image_id !== null ? { image_id } : {})
          }
        });

        // Create MCQ options if provided
        if (mcq_options && mcq_options.length > 0) {
          await Promise.all(mcq_options.map(async (option) => {
            // Check if option image exists if provided
            if (option.image_id !== undefined && option.image_id !== null) {
              const image = await this.prisma.image.findUnique({
                where: { id: option.image_id }
              });
              
              if (!image) {
                throw new NotFoundException(`Image with ID ${option.image_id} for MCQ option not found`);
              }
            }
            
            return prisma.mcq_Option.create({
              data: {
                option_text: option.option_text,
                is_correct: option.is_correct ?? false,
                ...(option.image_id !== undefined && option.image_id !== null ? { image_id: option.image_id } : {}),
                question_text_id: newQuestionText.id
              }
            });
          }));
        }

        // Create match pairs if provided
        if (match_pairs && match_pairs.length > 0) {
          await Promise.all(match_pairs.map(async (pair) => {
            // Check if left_image exists if provided
            if (pair.left_image_id !== undefined && pair.left_image_id !== null) {
              const leftImage = await this.prisma.image.findUnique({
                where: { id: pair.left_image_id }
              });
              
              if (!leftImage) {
                throw new NotFoundException(`Left image with ID ${pair.left_image_id} for match pair not found`);
              }
            }
            
            // Check if right_image exists if provided
            if (pair.right_image_id !== undefined && pair.right_image_id !== null) {
              const rightImage = await this.prisma.image.findUnique({
                where: { id: pair.right_image_id }
              });
              
              if (!rightImage) {
                throw new NotFoundException(`Right image with ID ${pair.right_image_id} for match pair not found`);
              }
            }
            
            return prisma.match_Pair.create({
              data: {
                ...(pair.left_text ? { left_text: pair.left_text } : {}),
                ...(pair.right_text ? { right_text: pair.right_text } : {}),
                ...(pair.left_image_id !== undefined && pair.left_image_id !== null ? { left_image_id: pair.left_image_id } : {}),
                ...(pair.right_image_id !== undefined && pair.right_image_id !== null ? { right_image_id: pair.right_image_id } : {}),
                question_text_id: newQuestionText.id
              }
            });
          }));
        }

        // Fetch the created question text with relations
        return await prisma.question_Text.findUnique({
          where: { id: newQuestionText.id },
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
      });
    } catch (error) {
      this.logger.error('Failed to create question text:', error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create question text');
    }
  }

  async findAll(filters: QuestionTextFilters) {
    try {
      const { 
        topic_id, 
        chapter_id, 
        question_type_id,
        instruction_medium_id,
        is_verified,
        page = 1, 
        page_size = 10, 
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      const skip = (page - 1) * page_size;
      
      // Build where clause
      let where: Prisma.Question_TextWhereInput = {};
      const andConditions: Prisma.Question_TextWhereInput[] = [];
      
      // Question-related filters
      if (topic_id || chapter_id || question_type_id) {
        const questionConditions: Prisma.QuestionWhereInput = {};
        
        if (question_type_id) {
          questionConditions.question_type_id = question_type_id;
        }
        
        if (topic_id || chapter_id) {
          const topicConditions: Prisma.Question_TopicWhereInput = {};
          
          if (topic_id) {
            topicConditions.topic_id = parseInt(String(topic_id), 10);
          }
          
          if (chapter_id) {
            topicConditions.topic = {
              chapter_id: parseInt(String(chapter_id), 10)
            };
          }
          
          questionConditions.question_topics = {
            some: topicConditions
          };
        }
        
        where.question = questionConditions;
      }
      
      // Handle instruction_medium_id filter using the junction table
      if (instruction_medium_id) {
        // Ensure instruction_medium_id is a number
        const mediumId = typeof instruction_medium_id === 'string' 
          ? parseInt(instruction_medium_id, 10) 
          : instruction_medium_id;
          
        this.logger.log(`Filtering question texts with instruction_medium_id: ${mediumId}`);
        
        andConditions.push({
          question_text_topics: {
            some: {
              instruction_medium: {
                id: mediumId
              }
            }
          }
        });
      }
      
      // Handle is_verified filter using the junction table
      if (is_verified !== undefined) {
        this.logger.log(`Filtering question texts with is_verified: ${is_verified}`);
        
        andConditions.push({
          question_text_topics: {
            some: {
              is_verified: is_verified
            }
          }
        });
      }
      
      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
      }
      
      // If we have AND conditions, add them to the where clause
      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.question_Text.count({ where });
      
      // Build orderBy object based on sort parameters
      const orderBy: any = {};
      
      // Make sure we're using a valid field for sorting
      if (Object.values(QuestionTextSortField).includes(sort_by)) {
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionTextSortField.CREATED_AT] = sort_order;
      }
      
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
          sort_by,
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch question texts:', error);
      throw new InternalServerErrorException('Failed to fetch question texts');
    }
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
      const { 
        question_text, 
        mcq_options, 
        match_pairs,
        image_id
      } = updateQuestionTextDto;

      // First check if the question text exists
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
      if (image_id !== undefined && image_id !== null) {
        const image = await this.prisma.image.findUnique({
          where: { id: image_id }
        });

        if (!image) {
          throw new NotFoundException(`Image with ID ${image_id} not found`);
        }
      }

      // Process update in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Update the question text
        await prisma.question_Text.update({
          where: { id },
          data: {
            question_text,
            ...(image_id !== undefined ? { image_id } : {})
          }
        });

        // Process MCQ options if provided
        if (mcq_options) {
          // Explicitly type mcq_options as UpdateMcqOptionDto[]
          const typedMcqOptions: UpdateMcqOptionDto[] = mcq_options;
          
          // Get existing MCQ options
          const existingOptions = await prisma.mcq_Option.findMany({
            where: { question_text_id: id }
          });
          
          // Create a map of existing options by ID for easy lookup
          const existingOptionsMap = new Map(
            existingOptions.map(option => [option.id, option])
          );
          
          // Process each MCQ option
          for (const option of typedMcqOptions) {
            // Check if option image exists if provided
            if (option.image_id !== undefined && option.image_id !== null) {
              const image = await this.prisma.image.findUnique({
                where: { id: option.image_id }
              });
              
              if (!image) {
                throw new NotFoundException(`Image with ID ${option.image_id} for MCQ option not found`);
              }
            }
            
            // If option has an ID, update it, otherwise create a new one
            if (option.id) {
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
            } else {
              // Create a new option
              await prisma.mcq_Option.create({
                data: {
                  question_text_id: id,
                  option_text: option.option_text,
                  is_correct: option.is_correct ?? false,
                  ...(option.image_id !== undefined && option.image_id !== null ? { image_id: option.image_id } : {})
                }
              });
            }
          }
          
          // Delete any remaining options that weren't updated
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

        // Process match pairs if provided
        if (match_pairs) {
          // Explicitly type match_pairs as UpdateMatchPairDto[]
          const typedMatchPairs: UpdateMatchPairDto[] = match_pairs;
          
          // Get existing match pairs
          const existingPairs = await prisma.match_Pair.findMany({
            where: { question_text_id: id }
          });
          
          // Create a map of existing pairs by ID for easy lookup
          const existingPairsMap = new Map(
            existingPairs.map(pair => [pair.id, pair])
          );
          
          // Process each match pair
          for (const pair of typedMatchPairs) {
            // Check if left image exists if provided
            if (pair.left_image_id !== undefined && pair.left_image_id !== null) {
              const leftImage = await this.prisma.image.findUnique({
                where: { id: pair.left_image_id }
              });
              
              if (!leftImage) {
                throw new NotFoundException(`Left image with ID ${pair.left_image_id} for match pair not found`);
              }
            }
            
            // Check if right image exists if provided
            if (pair.right_image_id !== undefined && pair.right_image_id !== null) {
              const rightImage = await this.prisma.image.findUnique({
                where: { id: pair.right_image_id }
              });
              
              if (!rightImage) {
                throw new NotFoundException(`Right image with ID ${pair.right_image_id} for match pair not found`);
              }
            }
            
            // If pair has an ID, update it, otherwise create a new one
            if (pair.id) {
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
            } else {
              // Create a new pair
              await prisma.match_Pair.create({
                data: {
                  question_text_id: id,
                  ...(pair.left_text ? { left_text: pair.left_text } : {}),
                  ...(pair.right_text ? { right_text: pair.right_text } : {}),
                  ...(pair.left_image_id !== undefined && pair.left_image_id !== null ? { left_image_id: pair.left_image_id } : {}),
                  ...(pair.right_image_id !== undefined && pair.right_image_id !== null ? { right_image_id: pair.right_image_id } : {})
                }
              });
            }
          }
          
          // Delete any remaining pairs that weren't updated
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

        // Return the updated question text with relations
        return await prisma.question_Text.findUnique({
          where: { id },
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
      });
    } catch (error) {
      this.logger.error('Failed to update question text:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update question text');
    }
  }

  async remove(id: number): Promise<{ message: string; deleted: { question_text: boolean; question?: boolean } }> {
    try {
      // Check if the record exists
      const questionText = await this.findOne(id);
      
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
        topic_id, 
        chapter_id, 
        question_type_id,
        instruction_medium_id,
        is_verified,
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      // Build where clause
      let where: Prisma.Question_TextWhereInput = {};
      const andConditions: Prisma.Question_TextWhereInput[] = [];
      
      // Question-related filters
      if (topic_id || chapter_id || question_type_id) {
        const questionConditions: Prisma.QuestionWhereInput = {};
        
        if (question_type_id) {
          questionConditions.question_type_id = question_type_id;
        }
        
        if (topic_id || chapter_id) {
          const topicConditions: Prisma.Question_TopicWhereInput = {};
          
          if (topic_id) {
            topicConditions.topic_id = parseInt(String(topic_id), 10);
          }
          
          if (chapter_id) {
            topicConditions.topic = {
              chapter_id: parseInt(String(chapter_id), 10)
            };
          }
          
          questionConditions.question_topics = {
            some: topicConditions
          };
        }
        
        where.question = questionConditions;
      }
      
      // Handle instruction_medium_id filter using the junction table
      if (instruction_medium_id) {
        // Ensure instruction_medium_id is a number
        const mediumId = typeof instruction_medium_id === 'string' 
          ? parseInt(instruction_medium_id, 10) 
          : instruction_medium_id;
          
        this.logger.log(`Filtering question texts with instruction_medium_id: ${mediumId} (without pagination)`);
        
        andConditions.push({
          question_text_topics: {
            some: {
              instruction_medium: {
                id: mediumId
              }
            }
          }
        });
      }
      
      // Handle is_verified filter using the junction table
      if (is_verified !== undefined) {
        this.logger.log(`Filtering question texts with is_verified: ${is_verified} (without pagination)`);
        
        andConditions.push({
          question_text_topics: {
            some: {
              is_verified: is_verified
            }
          }
        });
      }
      
      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
      }
      
      // If we have AND conditions, add them to the where clause
      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
      
      // Make sure we're using valid sort fields
      const validSortFields = Object.values(QuestionTextSortField);
      const validatedSortBy = validSortFields.includes(sort_by as any) 
        ? sort_by as QuestionTextSortField 
        : QuestionTextSortField.CREATED_AT;

      // Get all question texts with sorting but without pagination
      const questionTexts = await this.prisma.question_Text.findMany({
        where,
        orderBy: {
          [validatedSortBy]: sort_order
        },
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
          sort_by: validatedSortBy, // Return the validated sort field
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all question texts:', error);
      throw new InternalServerErrorException('Failed to fetch all question texts');
    }
  }

  // Find question texts that need translation
  async findUntranslatedTexts(filters: QuestionTextFilters) {
    try {
      const {
        topic_id,
        chapter_id,
        question_type_id,
        page = 1,
        page_size = 10,
        sort_by = QuestionTextSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        instruction_medium_id,
        search
      } = filters;

      // Build where clause
      let where: Prisma.Question_TextWhereInput = {};
      const andConditions: Prisma.Question_TextWhereInput[] = [];

      // Question-related filters
      if (topic_id || chapter_id || question_type_id) {
        const questionConditions: Prisma.QuestionWhereInput = {};
        
        if (question_type_id) {
          questionConditions.question_type_id = question_type_id;
        }
        
        if (topic_id || chapter_id) {
          const topicConditions: Prisma.Question_TopicWhereInput = {};
          
          if (topic_id) {
            topicConditions.topic_id = parseInt(String(topic_id), 10);
          }
          
          if (chapter_id) {
            topicConditions.topic = {
              chapter_id: parseInt(String(chapter_id), 10)
            };
          }
          
          questionConditions.question_topics = {
            some: topicConditions
          };
        }
        
        where.question = questionConditions;
      }

      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
      }

      // Calculate pagination parameters
      const skip = (page - 1) * page_size;

      // Make sure we're using valid sort fields
      const validSortFields = Object.values(QuestionTextSortField);
      const validatedSortBy = validSortFields.includes(sort_by as any)
        ? sort_by as QuestionTextSortField
        : QuestionTextSortField.CREATED_AT;

      // Find question texts that need translation for the specified medium
      if (instruction_medium_id) {
        // Ensure instruction_medium_id is a number
        const mediumId = typeof instruction_medium_id === 'string'
          ? parseInt(instruction_medium_id, 10)
          : instruction_medium_id;

        this.logger.log(`Finding untranslated texts for instruction_medium_id: ${mediumId}`);

        // Add condition to find question texts that don't have a record in question_text_topics 
        // with the specified instruction_medium_id
        andConditions.push({
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

        // If we have AND conditions, add them to the where clause
        if (andConditions.length > 0) {
          where.AND = andConditions;
        }

        // Get count of all matching question texts
        const totalCount = await this.prisma.question_Text.count({ where });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / page_size);

        // Get question texts with pagination
        const questionTexts = await this.prisma.question_Text.findMany({
          where,
          skip,
          take: page_size,
          orderBy: {
            [validatedSortBy]: sort_order
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

        return {
          data: questionTexts,
          meta: {
            current_page: page,
            page_size,
            total_items: totalCount,
            total_pages: totalPages,
            sort_by: validatedSortBy,
            sort_order,
            search: search || undefined
          }
        };
      } else {
        throw new BadRequestException('instruction_medium_id is required to find untranslated texts');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to fetch untranslated question texts:', error);
      throw new InternalServerErrorException('Failed to fetch untranslated question texts');
    }
  }
} 