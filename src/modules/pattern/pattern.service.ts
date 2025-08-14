import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

interface FilterOptions {
  boardId?: number;
  standardId?: number;
  subjectId?: number;
  totalMarks?: number;
  page?: number;
  page_size?: number;
  sort_by?: SortField;
  sort_order?: SortOrder;
  search?: string;
}

@Injectable()
export class PatternService {
  private readonly logger = new Logger(PatternService.name);

  constructor(private prisma: PrismaService) {}

  async create(createPatternDto: CreatePatternDto) {
    try {
      // Verify board exists
      const board = await this.prisma.board.findUnique({
        where: { id: createPatternDto.board_id },
      });
      if (!board) {
        throw new NotFoundException('Board not found');
      }

      // Verify standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: createPatternDto.standard_id },
      });
      if (!standard) {
        throw new NotFoundException('Standard not found');
      }

      // Verify subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: createPatternDto.subject_id },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }

      return await this.prisma.pattern.create({
        data: createPatternDto,
        include: {
          board: true,
          standard: true,
          subject: true,
          sections: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create pattern:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create pattern');
    }
  }

  async findAll(filters: FilterOptions) {
    try {
      const {
        boardId,
        standardId,
        subjectId,
        totalMarks,
        page = 1,
        page_size = 10,
        sort_by = SortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search,
      } = filters;

      const skip = (page - 1) * page_size;

      // Build where clause
      const where: Prisma.PatternWhereInput = {};
      if (boardId) where.board_id = boardId;
      if (standardId) where.standard_id = standardId;
      if (subjectId) where.subject_id = subjectId;
      if (totalMarks) where.total_marks = totalMarks;

      // Add search condition
      if (search) {
        where.pattern_name = {
          contains: search,
          mode: 'insensitive', // Case-insensitive search
        };
      }

      // Get total count for pagination metadata
      const total = await this.prisma.pattern.count({ where });

      // Build orderBy object based on sort parameters
      const orderBy: Prisma.PatternOrderByWithRelationInput = {};

      // Handle special case for pattern_name since it's not directly a SortField enum value
      if (sort_by === SortField.NAME) {
        orderBy.pattern_name = sort_order;
      } else {
        orderBy[sort_by] = sort_order;
      }

      // Get paginated data with sorting
      const patterns = await this.prisma.pattern.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        include: {
          board: true,
          standard: true,
          subject: true,
          sections: true,
        },
      });

      return {
        data: patterns,
        meta: {
          total,
          page,
          page_size,
          total_pages: Math.ceil(total / page_size),
          sort_by,
          sort_order,
          search: search || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch all patterns:', error);
      throw new InternalServerErrorException('Failed to fetch all patterns');
    }
  }

  async findOne(id: number) {
    try {
      const pattern = await this.prisma.pattern.findUnique({
        where: { id },
        select: {
          id: true,
          pattern_name: true,
          board_id: true,
          standard_id: true,
          subject_id: true,
          total_marks: true,
          board: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          standard: {
            select: {
              id: true,
              name: true,
              sequence_number: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          sections: {
            select: {
              id: true,
              pattern_id: true,
              sequence_number: true,
              section_number: true,
              sub_section: true,
              section_name: true,
              total_questions: true,
              mandotory_questions: true,
              marks_per_question: true,
              subsection_question_types: {
                select: {
                  id: true,
                  section_id: true,
                  seqencial_subquestion_number: true,
                  question_type_id: true,
                  question_type: {
                    select: {
                      id: true,
                      type_name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!pattern) {
        throw new NotFoundException(`Pattern with ID ${id} not found`);
      }

      return pattern;
    } catch (error) {
      this.logger.error(`Failed to fetch pattern ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch pattern');
    }
  }

  async update(id: number, updatePatternDto: UpdatePatternDto) {
    try {
      await this.findOne(id);

      if (updatePatternDto.board_id) {
        const board = await this.prisma.board.findUnique({
          where: { id: updatePatternDto.board_id },
        });
        if (!board) throw new NotFoundException('Board not found');
      }

      if (updatePatternDto.standard_id) {
        const standard = await this.prisma.standard.findUnique({
          where: { id: updatePatternDto.standard_id },
        });
        if (!standard) throw new NotFoundException('Standard not found');
      }

      if (updatePatternDto.subject_id) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: updatePatternDto.subject_id },
        });
        if (!subject) throw new NotFoundException('Subject not found');
      }

      return await this.prisma.pattern.update({
        where: { id },
        data: updatePatternDto,
        include: {
          board: true,
          standard: true,
          subject: true,
          sections: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update pattern ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update pattern');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);
      await this.prisma.pattern.delete({ where: { id } });
      return { message: 'Pattern deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete pattern ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete pattern');
    }
  }

  async findAllWithoutPagination(
    filters: Omit<FilterOptions, 'page' | 'page_size'>,
  ) {
    try {
      const {
        boardId,
        standardId,
        subjectId,
        totalMarks,
        sort_by = SortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search,
      } = filters;

      // Build where clause
      const where: Prisma.PatternWhereInput = {};
      if (boardId) where.board_id = boardId;
      if (standardId) where.standard_id = standardId;
      if (subjectId) where.subject_id = subjectId;
      if (totalMarks) where.total_marks = totalMarks;

      // Add search condition
      if (search) {
        where.pattern_name = {
          contains: search,
          mode: 'insensitive', // Case-insensitive search
        };
      }

      // Build orderBy object based on sort parameters
      const orderBy: Prisma.PatternOrderByWithRelationInput = {};

      // Handle special case for pattern_name since it's not directly a SortField enum value
      if (sort_by === SortField.NAME) {
        orderBy.pattern_name = sort_order;
      } else {
        orderBy[sort_by] = sort_order;
      }

      // Get all patterns with sorting but without pagination
      const patterns = await this.prisma.pattern.findMany({
        where,
        orderBy,
        include: {
          board: true,
          standard: true,
          subject: true,
          sections: true,
        },
      });

      return {
        data: patterns,
        meta: {
          sort_by,
          sort_order,
          search: search || undefined,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch all patterns:', error);
      throw new InternalServerErrorException('Failed to fetch all patterns');
    }
  }
}
