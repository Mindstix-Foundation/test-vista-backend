import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubsectionQuestionTypeDto } from './dto/create-subsection-question-type.dto';
import { UpdateSubsectionQuestionTypeDto } from './dto/update-subsection-question-type.dto';

@Injectable()
export class SubsectionQuestionTypeService {
  private readonly logger = new Logger(SubsectionQuestionTypeService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSubsectionQuestionTypeDto) {
    try {
      // Verify section exists
      const section = await this.prisma.section.findUnique({
        where: { id: createDto.section_id }
      });
      if (!section) {
        throw new NotFoundException('Section not found');
      }

      // Verify question type exists
      const questionType = await this.prisma.question_Type.findUnique({
        where: { id: createDto.question_type_id }
      });
      if (!questionType) {
        throw new NotFoundException('Question type not found');
      }

      return await this.prisma.subsection_Question_Type.create({
        data: createDto,
        include: {
          section: true,
          question_type: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create subsection question type:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create subsection question type');
    }
  }

  async findAll(sectionId?: number) {
    try {
      return await this.prisma.subsection_Question_Type.findMany({
        where: sectionId ? { section_id: sectionId } : undefined,
        include: {
          section: true,
          question_type: true
        },
        orderBy: {
          seqencial_subquestion_number: 'asc'
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch subsection question types:', error);
      throw new InternalServerErrorException('Failed to fetch subsection question types');
    }
  }

  async findOne(id: number) {
    try {
      const subsectionQuestionType = await this.prisma.subsection_Question_Type.findUnique({
        where: { id },
        include: {
          section: true,
          question_type: true
        }
      });

      if (!subsectionQuestionType) {
        throw new NotFoundException(`Subsection question type with ID ${id} not found`);
      }

      return subsectionQuestionType;
    } catch (error) {
      this.logger.error(`Failed to fetch subsection question type ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch subsection question type');
    }
  }

  async update(id: number, updateDto: UpdateSubsectionQuestionTypeDto) {
    try {
      await this.findOne(id);

      if (updateDto.section_id) {
        const section = await this.prisma.section.findUnique({
          where: { id: updateDto.section_id }
        });
        if (!section) {
          throw new NotFoundException('Section not found');
        }
      }

      if (updateDto.question_type_id) {
        const questionType = await this.prisma.question_Type.findUnique({
          where: { id: updateDto.question_type_id }
        });
        if (!questionType) {
          throw new NotFoundException('Question type not found');
        }
      }

      return await this.prisma.subsection_Question_Type.update({
        where: { id },
        data: updateDto,
        include: {
          section: true,
          question_type: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update subsection question type ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update subsection question type');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);
      await this.prisma.subsection_Question_Type.delete({ where: { id } });
      return { message: 'Subsection question type deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete subsection question type ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete subsection question type');
    }
  }
} 