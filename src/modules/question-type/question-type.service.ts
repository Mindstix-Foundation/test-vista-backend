import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionTypeDto } from './dto/create-question-type.dto';

@Injectable()
export class QuestionTypeService {
  private readonly logger = new Logger(QuestionTypeService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateQuestionTypeDto) {
    try {
      return await this.prisma.question_Type.create({
        data: createDto,
        include: {
          subsection_question_types: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create question type:', error);
      throw new InternalServerErrorException('Failed to create question type');
    }
  }

  async findAll() {
    try {
      return await this.prisma.question_Type.findMany({
        include: {
          subsection_question_types: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch question types:', error);
      throw new InternalServerErrorException('Failed to fetch question types');
    }
  }

  async findOne(id: number) {
    try {
      const questionType = await this.prisma.question_Type.findUnique({
        where: { id },
        include: {
          subsection_question_types: true
        }
      });

      if (!questionType) {
        throw new NotFoundException(`Question type with ID ${id} not found`);
      }

      return questionType;
    } catch (error) {
      this.logger.error(`Failed to fetch question type ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch question type');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);
      await this.prisma.question_Type.delete({ where: { id } });
      return { message: 'Question type deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete question type ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete question type');
    }
  }
} 