import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(private prisma: PrismaService) {}

  async create(createChapterDto: CreateChapterDto) {
    try {
      const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id: createChapterDto.medium_standard_subject_id },
      });

      if (!mediumStandardSubject) {
        throw new NotFoundException('Medium Standard Subject not found');
      }

      const existingChapter = await this.prisma.chapter.findFirst({
        where: {
          medium_standard_subject_id: createChapterDto.medium_standard_subject_id,
          sequential_chapter_number: createChapterDto.sequential_chapter_number,
        },
      });

      if (existingChapter) {
        throw new ConflictException(
          `Chapter with sequence number ${createChapterDto.sequential_chapter_number} already exists for this medium standard subject`,
        );
      }

      const chapterData = {
        ...createChapterDto,
        name: toTitleCase(createChapterDto.name),
      };

      return await this.prisma.chapter.create({
        data: chapterData,
        include: {
          medium_standard_subject: true,
          topics: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create chapter:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create chapter');
    }
  }

  async findAll() {
    try {
      return await this.prisma.chapter.findMany({
        include: {
          medium_standard_subject: true,
          topics: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to fetch chapters:', error);
      throw new InternalServerErrorException('Failed to fetch chapters');
    }
  }

  async findOne(id: number) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id },
        include: {
          medium_standard_subject: true,
          topics: true,
        },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      return chapter;
    } catch (error) {
      this.logger.error(`Failed to fetch chapter ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch chapter');
    }
  }

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    try {
      const existingChapter = await this.findOne(id);

      if (updateChapterDto.medium_standard_subject_id) {
        const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
          where: { id: updateChapterDto.medium_standard_subject_id },
        });

        if (!mediumStandardSubject) {
          throw new NotFoundException('Medium Standard Subject not found');
        }
      }

      if (updateChapterDto.sequential_chapter_number) {
        const duplicateSequence = await this.prisma.chapter.findFirst({
          where: {
            id: { not: id },
            medium_standard_subject_id: updateChapterDto.medium_standard_subject_id || existingChapter.medium_standard_subject_id,
            sequential_chapter_number: updateChapterDto.sequential_chapter_number,
          },
        });

        if (duplicateSequence) {
          throw new ConflictException(
            `Chapter with sequence number ${updateChapterDto.sequential_chapter_number} already exists for this medium standard subject`,
          );
        }
      }

      const chapterData = {
        ...updateChapterDto,
        name: updateChapterDto.name ? toTitleCase(updateChapterDto.name) : undefined,
      };

      return await this.prisma.chapter.update({
        where: { id },
        data: chapterData,
        include: {
          medium_standard_subject: true,
          topics: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update chapter ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update chapter');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);

      await this.prisma.chapter.delete({
        where: { id },
      });

      return { message: 'Chapter deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete chapter ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete chapter');
    }
  }
} 