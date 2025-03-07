import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionTextDto, UpdateQuestionTextDto, QuestionTextFilterDto } from './dto/question-text.dto';

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

      // Verify topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: createDto.topic_id }
      });

      if (!topic) {
        throw new NotFoundException(`Topic with ID ${createDto.topic_id} not found`);
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

      return await this.prisma.question_Text.create({
        data: createDto,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
          topic: true,
          image: true,
          mcq_options: true,
          match_pairs: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create question text:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create question text');
    }
  }

  async findAll(filters: QuestionTextFilterDto) {
    try {
      const where: any = {};
      
      if (filters.topic_id) {
        where.topic_id = filters.topic_id;
      }

      return await this.prisma.question_Text.findMany({
        where,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
          topic: true,
          image: true,
          mcq_options: true,
          match_pairs: true
        }
      });
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
          topic: true,
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
      await this.findOne(id);

      if (updateDto.topic_id) {
        const topic = await this.prisma.topic.findUnique({
          where: { id: updateDto.topic_id }
        });

        if (!topic) {
          throw new NotFoundException(`Topic with ID ${updateDto.topic_id} not found`);
        }
      }

      if (updateDto.image_id) {
        const image = await this.prisma.image.findUnique({
          where: { id: updateDto.image_id }
        });

        if (!image) {
          throw new NotFoundException(`Image with ID ${updateDto.image_id} not found`);
        }
      }

      return await this.prisma.question_Text.update({
        where: { id },
        data: updateDto,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
          topic: true,
          image: true,
          mcq_options: true,
          match_pairs: true
        }
      });
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
        - ${questionText.match_pairs.length} match pairs`);

      await this.prisma.question_Text.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted question text ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete question text ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question text');
    }
  }
} 