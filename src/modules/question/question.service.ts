import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto } from './dto/question.dto';

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
              topic: true,
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

  async findAll(filters: QuestionFilterDto) {
    try {
      const where: any = {};
      
      if (filters.question_type_id) {
        where.question_type_id = filters.question_type_id;
      }

      return await this.prisma.question.findMany({
        where,
        include: {
          question_type: true,
          question_texts: {
            include: {
              topic: true,
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
          }
        }
      });
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
              topic: true,
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
              topic: true,
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
        and all their related images`);

      await this.prisma.question.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted question ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question');
    }
  }
} 