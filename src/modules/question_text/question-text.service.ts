import { Injectable, Logger, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionTextDto, UpdateQuestionTextDto, QuestionTextFilterDto, QuestionTextSortField } from './dto/question-text.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

interface QuestionTextFilters {
  topic_id?: number;
  chapter_id?: number;
  question_type_id?: number;
  instruction_medium_id?: number;
  is_verified?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: QuestionTextSortField;
  sort_order?: SortOrder;
  search?: string;
}

@Injectable()
export class QuestionTextService {
  private readonly logger = new Logger(QuestionTextService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createQuestionTextDto: CreateQuestionTextDto) {
    try {
      const { 
        question_id, 
        question_text, 
        mcq_options, 
        match_pairs,
        image_id,
        instruction_medium_id,
        topic_id,
        is_verified = false 
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

      // Check if the instruction medium exists
      if (instruction_medium_id) {
        const medium = await this.prisma.instruction_Medium.findUnique({
          where: { id: instruction_medium_id }
        });

        if (!medium) {
          throw new NotFoundException(`Instruction medium with ID ${instruction_medium_id} not found`);
        }
      }

      // Get the topic if topic_id is provided, otherwise use the first topic of the question
      let selectedTopicId = topic_id;
      
      if (!selectedTopicId && question.question_topics.length > 0) {
        selectedTopicId = question.question_topics[0].id;
      }
      
      if (!selectedTopicId) {
        throw new BadRequestException('No topic_id provided and question has no topics');
      }

      // Check if the topic exists and is associated with the question
      const questionTopic = await this.prisma.question_Topic.findFirst({
        where: {
          id: selectedTopicId,
          question_id: question_id
        }
      });

      if (!questionTopic) {
        throw new NotFoundException(
          `Topic with ID ${selectedTopicId} not found or not associated with question ${question_id}`
        );
      }

      return await this.prisma.$transaction(async (prisma) => {
        // Create the question text
        const newQuestionText = await prisma.question_Text.create({
          data: {
            question_id,
            question_text,
            image_id
          }
        });

        // Create the question_text_topic_medium junction record
        if (instruction_medium_id) {
          await prisma.question_Text_Topic_Medium.create({
            data: {
              question_text_id: newQuestionText.id,
              question_topic_id: selectedTopicId,
              instruction_medium_id,
              is_verified
            }
          });
        }

        // Create MCQ options if provided
        if (mcq_options && mcq_options.length > 0) {
          await prisma.mcq_Option.createMany({
            data: mcq_options.map(option => ({
              option_text: option.option_text,
              is_correct: option.is_correct ?? false,
              question_text_id: newQuestionText.id
            }))
          });
        }

        // Create match pairs if provided
        if (match_pairs && match_pairs.length > 0) {
          await prisma.match_Pair.createMany({
            data: match_pairs.map(pair => ({
              left_text: pair.left_text,
              right_text: pair.right_text,
              question_text_id: newQuestionText.id
            }))
          });
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
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to create question text:', error);
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

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${id} not found`);
      }

      return questionText;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch question text with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to fetch question text with ID ${id}`);
    }
  }

  async update(id: number, updateDto: UpdateQuestionTextDto) {
    try {
      // First check if the question text exists
      const questionText = await this.prisma.question_Text.findUnique({
        where: { id },
        include: {
          question_text_topics: true
        }
      });

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${id} not found`);
      }

      // Check if instruction medium exists if provided
      if (updateDto.instruction_medium_id) {
        const medium = await this.prisma.instruction_Medium.findUnique({
          where: { id: updateDto.instruction_medium_id }
        });
        
        if (!medium) {
          throw new NotFoundException(`Instruction medium with ID ${updateDto.instruction_medium_id} not found`);
        }
      }

      // Check if topic exists if provided
      if (updateDto.topic_id) {
        const questionTopic = await this.prisma.question_Topic.findFirst({
          where: {
            id: updateDto.topic_id,
            question_id: questionText.question_id
          }
        });
        
        if (!questionTopic) {
          throw new NotFoundException(
            `Topic with ID ${updateDto.topic_id} not found or not associated with this question`
          );
        }
      }

      // Execute update in a transaction
      return await this.prisma.$transaction(async (prisma) => {
        // Update the question text basic fields
        const updatedQuestionText = await prisma.question_Text.update({
          where: { id },
          data: {
            question_text: updateDto.question_text,
            image_id: updateDto.image_id
          }
        });

        // Update or create the question_text_topic_medium junction record
        if (updateDto.instruction_medium_id !== undefined || 
            updateDto.is_verified !== undefined || 
            updateDto.topic_id !== undefined) {
          
          // Get current topic relationship
          const currentRelation = questionText.question_text_topics[0];
          
          if (currentRelation) {
            // Update existing relationship
            await prisma.question_Text_Topic_Medium.update({
              where: { id: currentRelation.id },
              data: {
                instruction_medium_id: updateDto.instruction_medium_id,
                is_verified: updateDto.is_verified,
                question_topic_id: updateDto.topic_id
              }
            });
          } else if (updateDto.instruction_medium_id && updateDto.topic_id) {
            // Create new relationship if none exists and we have the required IDs
            await prisma.question_Text_Topic_Medium.create({
              data: {
                question_text_id: id,
                question_topic_id: updateDto.topic_id,
                instruction_medium_id: updateDto.instruction_medium_id,
                is_verified: updateDto.is_verified || false
              }
            });
          }
        }

        // Update MCQ options if provided
        if (updateDto.mcq_options) {
          // Delete existing options
          await prisma.mcq_Option.deleteMany({
            where: { question_text_id: id }
          });
          
          // Create new options
          if (updateDto.mcq_options.length > 0) {
            await prisma.mcq_Option.createMany({
              data: updateDto.mcq_options.map(option => ({
                option_text: option.option_text,
                is_correct: option.is_correct ?? false,
                question_text_id: id
              }))
            });
          }
        }

        // Update match pairs if provided
        if (updateDto.match_pairs) {
          // Delete existing pairs
          await prisma.match_Pair.deleteMany({
            where: { question_text_id: id }
          });
          
          // Create new pairs
          if (updateDto.match_pairs.length > 0) {
            await prisma.match_Pair.createMany({
              data: updateDto.match_pairs.map(pair => ({
                left_text: pair.left_text,
                right_text: pair.right_text,
                question_text_id: id
              }))
            });
          }
        }

        // Return the updated question text with all relations
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
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update question text with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to update question text with ID ${id}`);
    }
  }

  async remove(id: number): Promise<{ message: string; deleted: { question_text: boolean; question?: boolean } }> {
    try {
      // First, find the question text to get its question ID
      const questionText = await this.findOne(id);
      const questionId = questionText.question_id;

      // Count how many question texts are associated with this question
      const questionTextsCount = await this.prisma.question_Text.count({
        where: { 
          question_id: questionId 
        }
      });

      this.logger.log(`Question ${questionId} has ${questionTextsCount} question text(s)`);

      // If this is the only question text for this question, delete the question as well
      if (questionTextsCount === 1) {
        this.logger.log(`Deleting question ${questionId} as this is its only question text`);
        
        // Delete the parent question (which will cascade delete the question text)
        await this.prisma.question.delete({
          where: { id: questionId }
        });
        
        this.logger.log(`Successfully deleted question ${questionId} and its only question text ${id}`);
        
        return {
          message: `Question text ${id} was the only text for question ${questionId}. Both have been deleted.`,
          deleted: {
            question_text: true,
            question: true
          }
        };
      } else {
        // Delete only the question text
        await this.prisma.question_Text.delete({
          where: { id }
        });
        
        this.logger.log(`Successfully deleted question text ${id}. Question ${questionId} still has other question texts.`);
        
        return {
          message: `Question text ${id} deleted. Question ${questionId} still has ${questionTextsCount - 1} other question text(s).`,
          deleted: {
            question_text: true
          }
        };
      }
    } catch (error) {
      this.logger.error(`Failed to delete question text ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question text');
    }
  }

  async batchVerify(ids: number[], isVerified: boolean): Promise<{ count: number }> {
    try {
      // Check if all IDs exist
      const existingTexts = await this.prisma.question_Text.findMany({
        where: {
          id: {
            in: ids
          }
        },
        select: {
          id: true
        }
      });

      const existingIds = existingTexts.map(text => text.id);
      const notFoundIds = ids.filter(id => !existingIds.includes(id));

      if (notFoundIds.length > 0) {
        throw new NotFoundException(`Some question texts were not found: ${notFoundIds.join(', ')}`);
      }

      // Update all the specified question texts with the verification status
      const result = await this.prisma.question_Text.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          is_verified: isVerified
        } as any // Use type assertion to bypass the type checking
      });

      this.logger.log(`Updated verification status to ${isVerified} for ${result.count} question texts`);

      return { count: result.count };
    } catch (error) {
      this.logger.error(`Failed to batch verify question texts:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to batch verify question texts');
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