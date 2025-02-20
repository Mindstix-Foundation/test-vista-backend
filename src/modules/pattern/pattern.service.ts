import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatternDto } from './dto/create-pattern.dto';
import { UpdatePatternDto } from './dto/update-pattern.dto';

interface FilterOptions {
  boardId?: number;
  standardId?: number;
  subjectId?: number;
  totalMarks?: number;
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
      const where: any = {};
      
      if (filters.boardId) where.board_id = filters.boardId;
      if (filters.standardId) where.standard_id = filters.standardId;
      if (filters.subjectId) where.subject_id = filters.subjectId;
      if (filters.totalMarks) where.total_marks = filters.totalMarks;

      return await this.prisma.pattern.findMany({
        where,
        include: {
          board: true,
          standard: true,
          subject: true,
          sections: true,
        },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch patterns:', error);
      throw new InternalServerErrorException('Failed to fetch patterns');
    }
  }

  async findOne(id: number) {
    try {
      const pattern = await this.prisma.pattern.findUnique({
        where: { id },
        include: {
          board: true,
          standard: true,
          subject: true,
          sections: true,
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
} 