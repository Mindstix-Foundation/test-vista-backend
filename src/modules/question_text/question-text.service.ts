import { Injectable, Logger, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
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

  async create(createDto: CreateQuestionTextDto) {
    try {
      // Verify question exists
      const question = await this.prisma.question.findUnique({
        where: { id: createDto.question_id }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${createDto.question_id} not found`);
      }

      // Verify instruction medium exists
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id }
      });

      if (!instructionMedium) {
        throw new NotFoundException(`Instruction medium with ID ${createDto.instruction_medium_id} not found`);
      }

      // Verify image exists if provided
      if (createDto.image_id) {
        const image = await this.prisma.image.findUnique({
          where: { id: createDto.image_id }
        });

        if (!image) {
          throw new NotFoundException(`Image with ID ${createDto.image_id} not found`);
        }
      }

      // Create question text with optional is_verified field
      const questionText = await this.prisma.question_Text.create({
        data: {
          question_id: createDto.question_id,
          instruction_medium_id: createDto.instruction_medium_id,
          image_id: createDto.image_id,
          question_text: createDto.question_text,
          is_verified: createDto.is_verified !== undefined ? createDto.is_verified : false,
        } as any,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
          instruction_medium: true,
          image: true
        }
      });

      return questionText;
    } catch (error) {
      this.logger.error('Failed to create question text:', error);
      if (error instanceof NotFoundException) {
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
      const questionConditions: any = {};
      
      if (topic_id) {
        questionConditions.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      if (chapter_id) {
        questionConditions.question_topics = {
          some: {
            topic: {
              chapter_id: chapter_id
            }
          }
        };
      }
      
      if (question_type_id) {
        questionConditions.question_type_id = question_type_id;
      }
      
      // Apply question conditions if any were set
      if (Object.keys(questionConditions).length > 0) {
        where.question = questionConditions;
      }
      
      if (instruction_medium_id) {
        where.instruction_medium_id = instruction_medium_id;
      }
      
      // Add is_verified filter if provided
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
      }
      
      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
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
          instruction_medium: true,
          image: true,
          mcq_options: true,
          match_pairs: true
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
              question_type: true
            }
          },
          instruction_medium: true,
          image: true,
          mcq_options: true,
          match_pairs: true
        }
      });

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${id} not found`);
      }

      return questionText;
    } catch (error) {
      this.logger.error(`Failed to fetch question text ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch question text');
    }
  }

  async update(id: number, updateDto: UpdateQuestionTextDto) {
    try {
      const questionText = await this.findOne(id);

      // Verify instruction medium exists if provided
      if (updateDto.instruction_medium_id) {
        const instructionMedium = await this.prisma.instruction_Medium.findUnique({
          where: { id: updateDto.instruction_medium_id }
        });

        if (!instructionMedium) {
          throw new NotFoundException(`Instruction medium with ID ${updateDto.instruction_medium_id} not found`);
        }
      }

      // Verify image exists if provided
      if (updateDto.image_id) {
        const image = await this.prisma.image.findUnique({
          where: { id: updateDto.image_id }
        });

        if (!image) {
          throw new NotFoundException(`Image with ID ${updateDto.image_id} not found`);
        }
      }

      const data: any = {};
      
      if (updateDto.instruction_medium_id) {
        data.instruction_medium = { connect: { id: updateDto.instruction_medium_id } };
      }
      
      if (updateDto.image_id) {
        data.image = { connect: { id: updateDto.image_id } };
      } else if (updateDto.image_id === null) {
        data.image = { disconnect: true };
      }
      
      if (updateDto.question_text) {
        data.question_text = updateDto.question_text;
      }
      
      // Handle is_verified field if provided
      if (updateDto.is_verified !== undefined) {
        data.is_verified = updateDto.is_verified;
      }

      const updated = await this.prisma.question_Text.update({
        where: { id },
        data,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
          instruction_medium: true,
          image: true,
          mcq_options: true,
          match_pairs: true
        }
      });

      // No longer need to set question as unverified when text is updated
      // since verification status is now stored on the question_text

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update question text ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update question text');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const questionText = await this.findOne(id);

      await this.prisma.question_Text.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted question text ${id} and all related records through cascade delete`);
    } catch (error) {
      this.logger.error(`Failed to delete question text ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question text');
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
      const questionConditions: any = {};
      
      if (topic_id) {
        questionConditions.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      if (chapter_id) {
        questionConditions.question_topics = {
          some: {
            topic: {
              chapter_id: chapter_id
            }
          }
        };
      }
      
      if (question_type_id) {
        questionConditions.question_type_id = question_type_id;
      }
      
      // Apply question conditions if any were set
      if (Object.keys(questionConditions).length > 0) {
        where.question = questionConditions;
      }
      
      if (instruction_medium_id) {
        where.instruction_medium_id = instruction_medium_id;
      }
      
      // Add is_verified filter if provided
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
      }
      
      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
      }
      
      // Get all question texts with sorting but without pagination
      const questionTexts = await this.prisma.question_Text.findMany({
        where,
        orderBy: {
          [sort_by]: sort_order
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
          match_pairs: true
        }
      });
      
      return {
        data: questionTexts,
        meta: {
          sort_by,
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all question texts:', error);
      throw new InternalServerErrorException('Failed to fetch all question texts');
    }
  }

  async findUntranslatedTexts(mediumId: number, filters: QuestionTextFilters) {
    try {
      const { 
        topic_id, 
        chapter_id, 
        question_type_id,
        is_verified,
        page = 1, 
        page_size = 10, 
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      // First find questions that have texts in other mediums but not in the target medium
      const questionsWithOtherTexts = await this.prisma.question.findMany({
        where: {
          question_texts: {
            some: {} // Has some texts
          },
          NOT: {
            question_texts: {
              some: {
                instruction_medium_id: mediumId
              }
            }
          }
        },
        select: {
          id: true
        }
      });
      
      const questionIds = questionsWithOtherTexts.map(q => q.id);
      
      // Build where clause for question texts
      let where: Prisma.Question_TextWhereInput = {
        // Only include texts for questions that need translation
        question_id: {
          in: questionIds
        },
        // Exclude texts in the target medium (should be none anyway)
        NOT: {
          instruction_medium_id: mediumId
        }
      };
      
      const questionConditions: any = {};
      
      // Add topic filter if provided
      if (topic_id) {
        questionConditions.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      // Add chapter filter if provided
      if (chapter_id) {
        questionConditions.question_topics = {
          some: {
            topic: {
              chapter_id: chapter_id
            }
          }
        };
      }
      
      // Add question type filter if provided
      if (question_type_id) {
        questionConditions.question_type_id = question_type_id;
      }
      
      // Apply question conditions if any were set
      if (Object.keys(questionConditions).length > 0) {
        where.question = questionConditions;
      }
      
      // Add is_verified filter if provided
      if (is_verified !== undefined) {
        where.is_verified = is_verified;
      }
      
      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
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
        where,
        orderBy,
        skip: (page - 1) * page_size,
        take: page_size,
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
          instruction_medium: true,
          image: true,
          mcq_options: true,
          match_pairs: true
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
      this.logger.error('Failed to fetch question texts for translation:', error);
      throw new InternalServerErrorException('Failed to fetch question texts for translation');
    }
  }
} 