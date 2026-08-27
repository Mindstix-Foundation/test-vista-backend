import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../prisma/client';
import { CreateMcqOptionDto } from './dto/create-mcq-option.dto';
import { UpdateMcqOptionDto } from './dto/update-mcq-option.dto';
import { FilterMcqOptionDto } from './dto/filter-mcq-option.dto';

@Injectable()
export class McqOptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMcqOptionDto: CreateMcqOptionDto) {
    return this.prisma.mcq_Option.create({
      data: createMcqOptionDto,
      include: {
        question_text: true,
        image: true,
      },
    });
  }

  async findAll(filters: FilterMcqOptionDto = {}) {
    const { question_text_id } = filters;
    
    const where = {};
    
    if (question_text_id) {
      where['question_text_id'] = question_text_id;
    }
    
    return this.prisma.mcq_Option.findMany({
      where,
      include: {
        question_text: true,
        image: true,
      },
    });
  }

  async findOne(id: number) {
    const mcqOption = await this.prisma.mcq_Option.findUnique({
      where: { id },
      include: {
        question_text: true,
        image: true,
      },
    });

    if (!mcqOption) {
      throw new NotFoundException(`MCQ Option with ID ${id} not found`);
    }

    return mcqOption;
  }

  async update(id: number, updateMcqOptionDto: UpdateMcqOptionDto) {
    try {
      return await this.prisma.mcq_Option.update({
        where: { id },
        data: updateMcqOptionDto,
        include: {
          question_text: true,
          image: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`MCQ Option with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.mcq_Option.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`MCQ Option with ID ${id} not found`);
      }
      throw error;
    }
  }
} 