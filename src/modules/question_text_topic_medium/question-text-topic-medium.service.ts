import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionTextTopicMediumDto, UpdateQuestionTextTopicMediumDto, QuestionTextTopicMediumFilterDto } from './dto/question-text-topic-medium.dto';

@Injectable()
export class QuestionTextTopicMediumService {
  private readonly logger = new Logger(QuestionTextTopicMediumService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateQuestionTextTopicMediumDto) {
    try {
      // Check if question_text exists
      const questionText = await this.prisma.question_Text.findUnique({
        where: { id: createDto.question_text_id }
      });

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${createDto.question_text_id} not found`);
      }

      // Check if question_topic exists
      const questionTopic = await this.prisma.question_Topic.findUnique({
        where: { id: createDto.question_topic_id }
      });

      if (!questionTopic) {
        throw new NotFoundException(`Question topic with ID ${createDto.question_topic_id} not found`);
      }

      // Check if instruction_medium exists
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id }
      });

      if (!instructionMedium) {
        throw new NotFoundException(`Instruction medium with ID ${createDto.instruction_medium_id} not found`);
      }

      // Check if the association already exists
      const existingAssociation = await this.prisma.question_Text_Topic_Medium.findFirst({
        where: {
          question_text_id: createDto.question_text_id,
          question_topic_id: createDto.question_topic_id,
          instruction_medium_id: createDto.instruction_medium_id
        }
      });

      if (existingAssociation) {
        throw new ConflictException(
          `Association between question text ${createDto.question_text_id}, question topic ${createDto.question_topic_id}, and instruction medium ${createDto.instruction_medium_id} already exists`
        );
      }

      // Create the association
      return await this.prisma.question_Text_Topic_Medium.create({
        data: createDto,
        include: {
          question_text: true,
          question_topic: {
            include: {
              question: true,
              topic: true
            }
          },
          instruction_medium: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create question text topic medium association:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create question text topic medium association');
    }
  }

  async findAll(filters: QuestionTextTopicMediumFilterDto) {
    try {
      const where: any = {};

      if (filters.question_text_id) {
        where.question_text_id = filters.question_text_id;
      }

      if (filters.question_topic_id) {
        where.question_topic_id = filters.question_topic_id;
      }

      if (filters.instruction_medium_id) {
        where.instruction_medium_id = filters.instruction_medium_id;
      }

      if (filters.is_verified !== undefined) {
        where.is_verified = filters.is_verified;
      }

      return await this.prisma.question_Text_Topic_Medium.findMany({
        where,
        include: {
          question_text: true,
          question_topic: {
            include: {
              question: true,
              topic: true
            }
          },
          instruction_medium: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch question text topic medium associations:', error);
      throw new InternalServerErrorException('Failed to fetch question text topic medium associations');
    }
  }

  async findOne(id: number) {
    try {
      const association = await this.prisma.question_Text_Topic_Medium.findUnique({
        where: { id },
        include: {
          question_text: true,
          question_topic: {
            include: {
              question: true,
              topic: true
            }
          },
          instruction_medium: true
        }
      });

      if (!association) {
        throw new NotFoundException(`Question text topic medium association with ID ${id} not found`);
      }

      return association;
    } catch (error) {
      this.logger.error(`Failed to fetch question text topic medium association with ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch question text topic medium association');
    }
  }

  async update(id: number, updateDto: UpdateQuestionTextTopicMediumDto) {
    try {
      // Check if the association exists
      const existingAssociation = await this.prisma.question_Text_Topic_Medium.findUnique({
        where: { id }
      });

      if (!existingAssociation) {
        throw new NotFoundException(`Question text topic medium association with ID ${id} not found`);
      }

      // Update the association
      return await this.prisma.question_Text_Topic_Medium.update({
        where: { id },
        data: updateDto,
        include: {
          question_text: true,
          question_topic: {
            include: {
              question: true,
              topic: true
            }
          },
          instruction_medium: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update question text topic medium association with ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update question text topic medium association');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if the record exists
      const record = await this.findOne(id);
      
      // Delete the record
      await this.prisma.question_Text_Topic_Medium.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Error removing question text topic medium association with ID ${id}:`, error);
      throw error;
    }
  }

  async batchUpdateVerificationStatus(ids: number[], is_verified: boolean) {
    try {
      // Validate if all IDs exist
      const existingRecords = await this.prisma.question_Text_Topic_Medium.findMany({
        where: {
          id: {
            in: ids
          }
        }
      });

      if (existingRecords.length !== ids.length) {
        const existingIds = existingRecords.map(record => record.id);
        const missingIds = ids.filter(id => !existingIds.includes(id));
        throw new NotFoundException(`Some associations were not found: ${missingIds.join(', ')}`);
      }

      // Batch update
      const result = await this.prisma.question_Text_Topic_Medium.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          is_verified,
          updated_at: new Date()
        }
      });

      return {
        affected: result.count,
        is_verified
      };
    } catch (error) {
      this.logger.error('Error in batch update verification status:', error);
      throw error;
    }
  }
} 