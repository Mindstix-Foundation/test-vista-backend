import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMediumStandardSubjectDto } from './dto/medium-standard-subject.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MediumStandardSubjectService {
  private readonly logger = new Logger(MediumStandardSubjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly mssSelect = {
    id: true,
    instruction_medium_id: true,
    standard_id: true,
    subject_id: true,
    instruction_medium: {
      select: {
        id: true,
        instruction_medium: true,
        board: {
          select: {
            name: true,
            abbreviation: true
          }
        }
      }
    },
    standard: {
      select: {
        id: true,
        name: true
      }
    },
    subject: {
      select: {
        id: true,
        name: true
      }
    },
    created_at: true,
    updated_at: true
  };

  async create(createDto: CreateMediumStandardSubjectDto) {
    try {
      // Check if instruction medium exists
      const medium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id }
      });
      if (!medium) {
        throw new NotFoundException(`Instruction medium with ID ${createDto.instruction_medium_id} not found`);
      }

      // Check if standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: createDto.standard_id }
      });
      if (!standard) {
        throw new NotFoundException(`Standard with ID ${createDto.standard_id} not found`);
      }

      // Check if subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: createDto.subject_id }
      });
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${createDto.subject_id} not found`);
      }

      return await this.prisma.medium_Standard_Subject.create({
        data: createDto,
        select: this.mssSelect
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('This combination already exists');
        }
      }
      throw error;
    }
  }

  async findAll(query: { instruction_medium_id?: number; standard_id?: number; subject_id?: number }) {
    try {
      return await this.prisma.medium_Standard_Subject.findMany({
        where: query,
        select: this.mssSelect
      });
    } catch (error) {
      this.logger.error('Failed to fetch medium standard subjects:', error);
      throw new InternalServerErrorException('Failed to fetch medium standard subjects');
    }
  }

  async findByMediumAndStandard(mediumId: number, standardId: number) {
    try {
      // Check if instruction medium exists
      const medium = await this.prisma.instruction_Medium.findUnique({
        where: { id: mediumId }
      });
      if (!medium) {
        throw new NotFoundException(`Instruction medium with ID ${mediumId} not found`);
      }

      // Check if standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: standardId }
      });
      if (!standard) {
        throw new NotFoundException(`Standard with ID ${standardId} not found`);
      }

      return await this.prisma.medium_Standard_Subject.findMany({
        where: {
          instruction_medium_id: mediumId,
          standard_id: standardId
        },
        select: this.mssSelect
      });
    } catch (error) {
      this.logger.error(`Failed to fetch subjects for medium ${mediumId} and standard ${standardId}:`, error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const mss = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id }
      });

      if (!mss) {
        throw new NotFoundException(`Medium standard subject with ID ${id} not found`);
      }

      // Check for related teacher subjects
      const hasTeacherSubjects = await this.prisma.teacher_Subject.count({
        where: { medium_standard_subject_id: id }
      });

      if (hasTeacherSubjects) {
        throw new ConflictException('Cannot delete as there are teachers assigned to this subject');
      }

      await this.prisma.medium_Standard_Subject.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete medium standard subject ${id}:`, error);
      throw error;
    }
  }
} 