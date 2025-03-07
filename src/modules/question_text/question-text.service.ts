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
        data: createDto,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
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

  async findAll(filters: QuestionTextFilterDto) {
    try {
      const where: any = {};
      
      if (filters.topic_id) {
        where.question = {
          question_topics: {
            some: {
              topic_id: filters.topic_id
            }
          }
        };
      }
      
      if (filters.chapter_id) {
        where.question = {
          question_topics: {
            some: {
              topic: {
                chapter_id: filters.chapter_id
              }
            }
          }
        };
      }
      
      if (filters.question_type_id) {
        if (!where.question) {
          where.question = {};
        }
        where.question.question_type_id = filters.question_type_id;
      }

      return await this.prisma.question_Text.findMany({
        where,
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

      if (updateDto.image_id) {
        const image = await this.prisma.image.findUnique({
          where: { id: updateDto.image_id }
        });

        if (!image) {
          throw new NotFoundException(`Image with ID ${updateDto.image_id} not found`);
        }
      }

      // Update the question text
      const updatedQuestionText = await this.prisma.question_Text.update({
        where: { id },
        data: updateDto,
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
      
      // Set question as unverified when text is updated
      await this.prisma.question.update({
        where: { id: questionText.question_id },
        data: { is_verified: false }
      });

      return updatedQuestionText;
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
      
      // Set question as unverified when text is deleted
      await this.prisma.question.update({
        where: { id: questionText.question_id },
        data: { is_verified: false }
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