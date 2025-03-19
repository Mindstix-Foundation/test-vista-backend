import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionTextDto, UpdateQuestionTextDto, QuestionTextFilterDto, QuestionTextSortField } from './dto/question-text.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

interface QuestionTextFilters {
  topic_id?: number;
  chapter_id?: number;
  question_type_id?: number;
  instruction_medium_id?: number;
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

      // Create the question text
      const questionText = await this.prisma.question_Text.create({
        data: {
          question: {
            connect: { id: createDto.question_id }
          },
          instruction_medium: {
            connect: { id: createDto.instruction_medium_id }
          },
          question_text: createDto.question_text,
          image: createDto.image_id ? {
            connect: { id: createDto.image_id }
          } : undefined
        },
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
      
      // Set question as unverified when new text is added
      await this.prisma.question.update({
        where: { id: createDto.question_id },
        data: { is_verified: false }
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
        page = 1, 
        page_size = 10, 
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      const skip = (page - 1) * page_size;
      
      // Build where clause
      const where: Prisma.Question_TextWhereInput = {};
      
      if (topic_id) {
        where.question = {
          question_topics: {
            some: {
              topic_id: topic_id
            }
          }
        };
      }
      
      if (chapter_id) {
        where.question = {
          question_topics: {
            some: {
              topic: {
                chapter_id: chapter_id
              }
            }
          }
        };
      }
      
      if (question_type_id) {
        where.question = {
          question_type_id: question_type_id
        };
      }
      
      if (instruction_medium_id) {
        where.instruction_medium_id = instruction_medium_id;
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

      // Set question as unverified when text is updated
      await this.prisma.question.update({
        where: { id: questionText.question_id },
        data: { is_verified: false }
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update question text ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update question text');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const questionText = await this.findOne(id);

      // Log what will be deleted
      this.logger.log(`Deleting question text ${id} will also delete:
        - ${questionText.mcq_options.length} MCQ options
        - ${questionText.match_pairs.length} match pairs
        and any image references will be preserved (set to null)`);

      await this.prisma.question_Text.delete({
        where: { id }
      });
      
      // Set question as unverified when text is deleted
      await this.prisma.question.update({
        where: { id: questionText.question_id },
        data: { is_verified: false }
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
        sort_by = QuestionTextSortField.CREATED_AT, 
        sort_order = SortOrder.DESC,
        search
      } = filters;
      
      // Build where clause
      const where: Prisma.Question_TextWhereInput = {};
      
      if (topic_id) {
        where.question = {
          question_topics: {
            some: {
              topic_id: topic_id
            }
          }
        };
      }
      
      if (chapter_id) {
        where.question = {
          question_topics: {
            some: {
              topic: {
                chapter_id: chapter_id
              }
            }
          }
        };
      }
      
      if (question_type_id) {
        where.question = {
          question_type_id: question_type_id
        };
      }
      
      if (instruction_medium_id) {
        where.instruction_medium_id = instruction_medium_id;
      }
      
      // Add search condition
      if (search) {
        where.question_text = {
          contains: search,
          mode: 'insensitive'
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: any = {};
      
      // Make sure we're using a valid field for sorting
      if (Object.values(QuestionTextSortField).includes(sort_by)) {
        orderBy[sort_by] = sort_order;
      } else {
        // Default to created_at if an invalid sort field is provided
        orderBy[QuestionTextSortField.CREATED_AT] = sort_order;
      }
      
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
} 