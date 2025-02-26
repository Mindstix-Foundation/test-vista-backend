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

      // Map the DTO to match schema field names
      const data = {
        ...(updateSectionDto.pattern_id && { pattern_id: updateSectionDto.pattern_id }),
        ...(updateSectionDto.sequence_number && { 
          sequence_number: updateSectionDto.sequence_number,
          section_number: updateSectionDto.section_number
        }),
        ...(updateSectionDto.sub_section && { sub_section: updateSectionDto.sub_section }),
        ...(updateSectionDto.section_name && { section_name: updateSectionDto.section_name }),
        ...(updateSectionDto.total_questions && { total_questions: updateSectionDto.total_questions }),
        ...(updateSectionDto.mandotory_questions && { mandotory_questions: updateSectionDto.mandotory_questions }),
        ...(updateSectionDto.marks_per_question && { marks_per_question: updateSectionDto.marks_per_question })
      };

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
    } catch (error) {
      this.logger.error(`Failed to update section ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update section');
    }
  }

  async reorderSection(sectionId: number, newPosition: number, patternId?: number) {
    try {
      this.logger.log(`Starting reorder for section ${sectionId} to position ${newPosition}`);
      
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

      // Get total sections count to validate newPosition
      const totalSections = await this.prisma.section.count({
        where: { pattern_id: currentSection.pattern_id }
      });

      this.logger.log(`Total sections in pattern: ${totalSections}`);

      // Validate newPosition
      if (newPosition < 1 || newPosition > totalSections) {
        throw new ConflictException(`New position must be between 1 and ${totalSections}`);
      }

      const currentPosition = currentSection.sequence_number;

      // If the positions are the same, no need to reorder
      if (currentPosition === newPosition) {
        return await this.findOne(sectionId);
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // First move to temporary position
          this.logger.log(`Moving section ${sectionId} to temporary position`);
          await tx.section.update({
            where: { id: sectionId },
            data: { sequence_number: 999 }
          });

          if (currentPosition < newPosition) {
            // Moving to a later position
            for (let i = currentPosition + 1; i <= newPosition; i++) {
              await tx.section.updateMany({
                where: {
                  pattern_id: currentSection.pattern_id,
                  sequence_number: i
                },
                data: {
                  sequence_number: i - 1
                }
              });
            }
          } else {
            // Moving to an earlier position
            for (let i = currentPosition - 1; i >= newPosition; i--) {
              await tx.section.updateMany({
                where: {
                  pattern_id: currentSection.pattern_id,
                  sequence_number: i
                },
                data: {
                  sequence_number: i + 1
                }
              });
            }
          }

          // Finally, move to new position
          this.logger.log(`Moving section to final position ${newPosition}`);
          await tx.section.update({
            where: { id: sectionId },
            data: { sequence_number: newPosition }
          });
        });

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