import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionTopicDto, QuestionTopicFilterDto } from './dto/question-topic.dto';

@Injectable()
export class QuestionTopicService {
  private readonly logger = new Logger(QuestionTopicService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateQuestionTopicDto) {
    try {
      // Check if question exists
      const question = await this.prisma.question.findUnique({
        where: { id: createDto.question_id }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${createDto.question_id} not found`);
      }

      // Check if topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: createDto.topic_id }
      });

      if (!topic) {
        throw new NotFoundException(`Topic with ID ${createDto.topic_id} not found`);
      }

      // Check if association already exists
      const existingAssociation = await this.prisma.question_Topic.findFirst({
        where: {
          question_id: createDto.question_id,
          topic_id: createDto.topic_id
        }
      });

      if (existingAssociation) {
        throw new ConflictException(`Association between question ${createDto.question_id} and topic ${createDto.topic_id} already exists`);
      }

      // Create the association
      return await this.prisma.question_Topic.create({
        data: createDto,
        include: {
          question: {
            include: {
              question_type: true
            }
          },
          topic: {
            include: {
              chapter: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to create question topic association:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create question topic association');
    }
  }

  async findAll(filters: QuestionTopicFilterDto) {
    try {
      const where: any = {};

      if (filters.question_id) {
        where.question_id = filters.question_id;
      }

      if (filters.topic_id) {
        where.topic_id = filters.topic_id;
      }

      if (filters.question_type_id) {
        where.question = {
          question_type_id: filters.question_type_id
        };
      }

      if (filters.chapter_id) {
        where.topic = {
          chapter_id: filters.chapter_id
        };
      }

      return await this.prisma.question_Topic.findMany({
        where,
        include: {
          question: {
            include: {
              question_type: true,
              question_texts: {
                include: {
                  image: true
                }
              }
            }
          },
          topic: {
            include: {
              chapter: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch question topic associations:', error);
      throw new InternalServerErrorException('Failed to fetch question topic associations');
    }
  }

  async findOne(id: number) {
    try {
      const questionTopic = await this.prisma.question_Topic.findUnique({
        where: { id },
        include: {
          question: {
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
              }
            }
          },
          topic: {
            include: {
              chapter: {
                include: {
                  subject: true,
                  standard: true
                }
              }
            }
          }
        }
      });

      if (!questionTopic) {
        throw new NotFoundException(`Question topic association with ID ${id} not found`);
      }

      return questionTopic;
    } catch (error) {
      this.logger.error(`Failed to fetch question topic association ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch question topic association');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const questionTopic = await this.findOne(id);

      await this.prisma.question_Topic.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted question topic association ${id} between question ${questionTopic.question_id} and topic ${questionTopic.topic_id}`);
    } catch (error) {
      this.logger.error(`Failed to delete question topic association ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question topic association');
    }
  }
} 