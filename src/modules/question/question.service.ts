import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField } from './dto/question.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

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
}

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateQuestionDto) {
    try {
      // Verify question type exists
      const questionType = await this.prisma.question_Type.findUnique({
        where: { id: createDto.question_type_id }
      });

      if (!questionType) {
        throw new NotFoundException(`Question type with ID ${createDto.question_type_id} not found`);
      }

      return await this.prisma.question.create({
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
        is_verified, 
        topic_id, 
        chapter_id, 
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
      
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
        
        // Log for debugging
        this.logger.log(`Filtering questions with is_verified=${is_verified} (type: ${typeof is_verified})`);
      }
      
      // Filter by topic ID if provided
      if (topic_id) {
        where.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      // Filter by chapter ID if provided
      if (chapter_id) {
        where.question_topics = {
          some: {
            topic: {
              chapter_id: chapter_id
            }
          }
        };
      }
      
      // Add search condition
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
      
      // Build orderBy object based on sort parameters
      const orderBy: any = {};
      
      // Handle special case for sorting by question text
      if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by the first question text of each question
        orderBy.question_texts = {
          _first: {
            question_text: sort_order
          }
        };
      } else if (Object.values(QuestionSortField).includes(sort_by)) {
        // For regular fields, sort directly
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionSortField.CREATED_AT] = sort_order;
      }
      
      // Get paginated data with sorting
      const questions = await this.prisma.question.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
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
      
      // Calculate total pages
      const total_pages = Math.ceil(total / page_size);
      
      this.logger.log(`Constructed where clause: ${JSON.stringify(where)}`);
      
      return {
        data: questions,
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

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      return question;
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

      return await this.prisma.question.update({
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
              topic: true
            }
          }
        }
      });
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
        is_verified, 
        topic_id, 
        chapter_id, 
        sort_by = QuestionSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      // Build where clause
      const where: Prisma.QuestionWhereInput = {};
      
      if (question_type_id) {
        where.question_type_id = question_type_id;
      }
      
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
        
        // Log for debugging
        this.logger.log(`Filtering questions with is_verified=${is_verified} (type: ${typeof is_verified})`);
      }
      
      // Filter by topic ID if provided
      if (topic_id) {
        where.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      // Filter by chapter ID if provided
      if (chapter_id) {
        where.question_topics = {
          some: {
            topic: {
              chapter_id
            }
          }
        };
      }
      
      // Add search condition
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
      
      // Build orderBy object based on sort parameters
      const orderBy: any = {};
      
      // Handle special case for sorting by question text
      if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by the first question text of each question
        orderBy.question_texts = {
          _first: {
            question_text: sort_order
          }
        };
      } else if (Object.values(QuestionSortField).includes(sort_by)) {
        // For regular fields, sort directly
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionSortField.CREATED_AT] = sort_order;
      }
      
      // Get all questions with sorting but without pagination
      const questions = await this.prisma.question.findMany({
        where,
        orderBy,
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
      
      // Get total count
      const total = await this.prisma.question.count({ where });
      
      // Remove the page_size reference and page/page_size from the return object
      this.logger.log(`Constructed where clause: ${JSON.stringify(where)}`);
      
      return {
        data: questions,
        meta: {
          total,
          sort_by,
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all questions:', error);
      throw new InternalServerErrorException('Failed to fetch all questions');
    }
  }
} 