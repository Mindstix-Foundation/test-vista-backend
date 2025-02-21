import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  private readonly logger = new Logger(SectionService.name);

  constructor(private prisma: PrismaService) {}

  async create(createSectionDto: CreateSectionDto) {
    try {
      // Verify pattern exists
      const pattern = await this.prisma.pattern.findUnique({
        where: { id: createSectionDto.pattern_id }
      });
      if (!pattern) {
        throw new NotFoundException('Pattern not found');
      }

      // Validate mandatory questions <= total questions
      if (createSectionDto.mandotory_questions > createSectionDto.total_questions) {
        throw new BadRequestException('Mandatory questions cannot exceed total questions');
      }

      return await this.prisma.section.create({
        data: createSectionDto,
        include: {
          pattern: true,
          subsection_question_types: {
            include: {
              question_type: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to create section:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create section');
    }
  }

  async findAll(patternId?: number) {
    try {
      return await this.prisma.section.findMany({
        where: patternId ? { pattern_id: patternId } : undefined,
        include: {
          pattern: true,
          subsection_question_types: {
            include: {
              question_type: true
            }
          }
        },
        orderBy: {
          seqencial_section_number: 'asc'
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch sections:', error);
      throw new InternalServerErrorException('Failed to fetch sections');
    }
  }

  async findOne(id: number) {
    try {
      const section = await this.prisma.section.findUnique({
        where: { id },
        include: {
          pattern: true,
          subsection_question_types: {
            include: {
              question_type: true
            }
          }
        }
      });

      if (!section) {
        throw new NotFoundException(`Section with ID ${id} not found`);
      }

      return section;
    } catch (error) {
      this.logger.error(`Failed to fetch section ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch section');
    }
  }

  async update(id: number, updateSectionDto: UpdateSectionDto) {
    try {
      await this.findOne(id);

      if (updateSectionDto.pattern_id) {
        const pattern = await this.prisma.pattern.findUnique({
          where: { id: updateSectionDto.pattern_id }
        });
        if (!pattern) {
          throw new NotFoundException('Pattern not found');
        }
      }

      // If updating questions, validate mandatory <= total
      if (updateSectionDto.total_questions || updateSectionDto.mandotory_questions) {
        const currentSection = await this.prisma.section.findUnique({
          where: { id }
        });
        const newTotal = updateSectionDto.total_questions ?? currentSection.total_questions;
        const newMandatory = updateSectionDto.mandotory_questions ?? currentSection.mandotory_questions;
        
        if (newMandatory > newTotal) {
          throw new BadRequestException('Mandatory questions cannot exceed total questions');
        }
      }

      return await this.prisma.section.update({
        where: { id },
        data: updateSectionDto,
        include: {
          pattern: true,
          subsection_question_types: {
            include: {
              question_type: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update section ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update section');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);
      await this.prisma.section.delete({ where: { id } });
      return { message: 'Section deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete section ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete section');
    }
  }
} 