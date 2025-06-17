import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, ConflictException } from '@nestjs/common';
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

      // Map the DTO to match schema field names
      const data = {
        pattern_id: createSectionDto.pattern_id,
        sequence_number: createSectionDto.sequence_number,
        section_number: createSectionDto.section_number,
        sub_section: createSectionDto.sub_section,
        section_name: createSectionDto.section_name,
        total_questions: createSectionDto.total_questions,
        mandotory_questions: createSectionDto.mandotory_questions,
        marks_per_question: createSectionDto.marks_per_question
      };

      return await this.prisma.section.create({
        data,
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
          sequence_number: 'asc'
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
      
      await this.validatePattern(updateSectionDto.pattern_id);
      await this.validateQuestionCounts(id, updateSectionDto);
      
      const data = this.mapUpdateDtoToData(updateSectionDto);
      
      return await this.prisma.section.update({
        where: { id },
        data,
        include: {
          pattern: true,
          subsection_question_types: {
            include: {
              question_type: true
            }
          }
        }
      });
    } 
    catch (error) {
      this.logger.error(`Failed to update section ${id}:`, error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update section');
    }
  }

  private async validatePattern(patternId?: number): Promise<void> {
    if (!patternId) return;
    
    const pattern = await this.prisma.pattern.findUnique({
      where: { id: patternId }
    });
    
    if (!pattern) {
      throw new NotFoundException('Pattern not found');
    }
  }

  private async validateQuestionCounts(sectionId: number, dto: UpdateSectionDto): Promise<void> {
    if (!dto.total_questions && !dto.mandotory_questions) return;
    
    const currentSection = await this.prisma.section.findUnique({
      where: { id: sectionId }
    });
    
    const newTotal = dto.total_questions ?? currentSection.total_questions;
    const newMandatory = dto.mandotory_questions ?? currentSection.mandotory_questions;
    
    if (newMandatory > newTotal) {
      throw new BadRequestException('Mandatory questions cannot exceed total questions');
    }
  }

  private mapUpdateDtoToData(dto: UpdateSectionDto): any {
    return {
      ...(dto.pattern_id && { pattern_id: dto.pattern_id }),
      ...(dto.sequence_number && { 
        sequence_number: dto.sequence_number,
        section_number: dto.section_number
      }),
      ...(dto.sub_section !== undefined && { sub_section: dto.sub_section }),
      ...(dto.section_name && { section_name: dto.section_name }),
      ...(dto.total_questions && { total_questions: dto.total_questions }),
      ...(dto.mandotory_questions && { mandotory_questions: dto.mandotory_questions }),
      ...(dto.marks_per_question && { marks_per_question: dto.marks_per_question })
    };
  }

  async reorderSection(sectionId: number, newPosition: number, patternId?: number) {
    try {
      this.logger.log(`Starting reorder for section ${sectionId} to position ${newPosition}`);
      
      const currentSection = await this.getAndValidateSection(sectionId, patternId);
      const currentPosition = currentSection.sequence_number;
      await this.validateReorderPosition(currentSection, newPosition);
      
      // If the positions are the same, no need to reorder
      if (currentPosition === newPosition) {
        return await this.findOne(sectionId);
      }

      try {
        await this.executeReordering(sectionId, currentSection, currentPosition, newPosition);
        return await this.findOne(sectionId);
      } catch (txError) {
        this.logger.error(`Transaction failed: ${txError.message}`, txError.stack);
        throw new InternalServerErrorException(`Failed to reorder: ${txError.message}`);
      }
    } catch (error) {
      this.logger.error(`Reorder failed for section ${sectionId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to reorder section: ${error.message}`);
    }
  }

  private async getAndValidateSection(sectionId: number, patternId?: number) {
    // Get the current section and its details
    const currentSection = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        pattern_id: true,
        sequence_number: true
      }
    });

    if (!currentSection) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    this.logger.log(`Found current section: ${JSON.stringify(currentSection)}`);

    // If patternId is provided, verify it matches
    if (patternId && patternId !== currentSection.pattern_id) {
      throw new ConflictException('Section does not belong to the specified pattern');
    }

    return currentSection;
  }

  private async validateReorderPosition(currentSection: any, newPosition: number): Promise<void> {
    // Get total sections count to validate newPosition
    const totalSections = await this.prisma.section.count({
      where: { pattern_id: currentSection.pattern_id }
    });

    this.logger.log(`Total sections in pattern: ${totalSections}`);

    // Validate newPosition
    if (newPosition < 1 || newPosition > totalSections) {
      throw new ConflictException(`New position must be between 1 and ${totalSections}`);
    }
  }

  private async executeReordering(sectionId: number, currentSection: any, currentPosition: number, newPosition: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // First move to temporary position
      this.logger.log(`Moving section ${sectionId} to temporary position`);
      await tx.section.update({
        where: { id: sectionId },
        data: { sequence_number: 999 }
      });

      if (currentPosition < newPosition) {
        await this.shiftSectionsDown(tx, currentSection.pattern_id, currentPosition, newPosition);
      } else {
        await this.shiftSectionsUp(tx, currentSection.pattern_id, newPosition, currentPosition);
      }

      // Finally, move to new position
      this.logger.log(`Moving section to final position ${newPosition}`);
      await tx.section.update({
        where: { id: sectionId },
        data: { sequence_number: newPosition }
      });
    });
  }

  private async shiftSectionsDown(tx: any, patternId: number, start: number, end: number): Promise<void> {
    // Moving to a later position - shift sections down
    for (let i = start + 1; i <= end; i++) {
      await tx.section.updateMany({
        where: {
          pattern_id: patternId,
          sequence_number: i
        },
        data: {
          sequence_number: i - 1
        }
      });
    }
  }

  private async shiftSectionsUp(tx: any, patternId: number, start: number, end: number): Promise<void> {
    // Moving to an earlier position - shift sections up
    for (let i = end - 1; i >= start; i--) {
      await tx.section.updateMany({
        where: {
          pattern_id: patternId,
          sequence_number: i
        },
        data: {
          sequence_number: i + 1
        }
      });
    }
  }

  async remove(id: number) {
    try {
      const sectionToDelete = await this.findOne(id);
      const currentPosition = sectionToDelete.sequence_number;

      await this.prisma.$transaction(async (tx) => {
        // First delete the section
        await tx.section.delete({
          where: { id }
        });

        // Update sequence numbers for remaining sections one by one
        const sectionsToUpdate = await tx.section.findMany({
          where: {
            pattern_id: sectionToDelete.pattern_id,
            sequence_number: {
              gt: currentPosition
            }
          },
          orderBy: {
            sequence_number: 'asc'
          }
        });

        for (const section of sectionsToUpdate) {
          await tx.section.update({
            where: { id: section.id },
            data: {
              sequence_number: section.sequence_number - 1
            }
          });
        }
      });

      return { message: 'Section deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete section ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete section');
    }
  }
} 