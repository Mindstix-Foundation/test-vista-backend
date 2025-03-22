import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMediumStandardSubjectDto, GetMssQueryDto } from './dto/medium-standard-subject.dto';
import { Prisma } from '@prisma/client';
import { parseQueryParams } from '../../utils/queryParams';

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
      // Get instruction medium with its board
      const instructionMedium = await this.prisma.instruction_Medium.findUnique({
        where: { id: createDto.instruction_medium_id },
        include: { board: true }
      });

      if (!instructionMedium) {
        throw new NotFoundException(`Instruction medium with ID ${createDto.instruction_medium_id} not found`);
      }

      // Get standard with its board
      const standard = await this.prisma.standard.findUnique({
        where: { id: createDto.standard_id },
        include: { board: true }
      });

      if (!standard) {
        throw new NotFoundException(`Standard with ID ${createDto.standard_id} not found`);
      }

      // Get subject with its board
      const subject = await this.prisma.subject.findUnique({
        where: { id: createDto.subject_id },
        include: { board: true }
      });

      if (!subject) {
        throw new NotFoundException(`Subject with ID ${createDto.subject_id} not found`);
      }

      // Check if all components belong to the same board
      if (instructionMedium.board_id !== standard.board_id || 
          standard.board_id !== subject.board_id) {
        throw new BadRequestException(
          'Invalid combination: Instruction medium, standard, and subject must belong to the same board. ' +
          `Instruction Medium Board: ${instructionMedium.board.name}, ` +
          `Standard Board: ${standard.board.name}, ` +
          `Subject Board: ${subject.board.name}`
        );
      }

      // Check for existing combination
      const existing = await this.prisma.medium_Standard_Subject.findFirst({
        where: {
          instruction_medium_id: createDto.instruction_medium_id,
          standard_id: createDto.standard_id,
          subject_id: createDto.subject_id
        }
      });

      if (existing) {
        throw new ConflictException('This combination already exists');
      }

      return await this.prisma.medium_Standard_Subject.create({
        data: createDto,
        include: {
          instruction_medium: {
            include: {
              board: true
            }
          },
          standard: true,
          subject: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create medium standard subject:', error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create medium standard subject');
    }
  }

  async findAll(boardId?: string, instruction_medium_id?: string, standard_id?: string, subject_id?: string) {
    try {
      const parsedParams = parseQueryParams(
        { boardId, instruction_medium_id, standard_id, subject_id },
        ['boardId', 'instruction_medium_id', 'standard_id', 'subject_id']
      );

      const where: any = {};

      if (parsedParams.boardId) {
        where.OR = [
          {
            instruction_medium: {
              board_id: parsedParams.boardId
            }
          },
          {
            standard: {
              board_id: parsedParams.boardId
            }
          },
          {
            subject: {
              board_id: parsedParams.boardId
            }
          }
        ];
      }

      if (parsedParams.instruction_medium_id) {
        where.instruction_medium_id = parsedParams.instruction_medium_id;
      }

      if (parsedParams.standard_id) {
        where.standard_id = parsedParams.standard_id;
      }

      if (parsedParams.subject_id) {
        where.subject_id = parsedParams.subject_id;
      }

      return await this.prisma.medium_Standard_Subject.findMany({
        where,
        select: this.mssSelect
      });
    } catch (error) {
      this.logger.error('Failed to fetch medium standard subjects:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch medium standard subjects');
    }
  }

  async findByMediumAndStandard(mediumId: number, standardId: number, boardId?: number) {
    try {
      // Check if instruction medium exists and belongs to the board if specified
      const medium = await this.prisma.instruction_Medium.findFirst({
        where: { 
          id: mediumId,
          ...(boardId && { board_id: boardId })
        }
      });
      
      if (!medium) {
        throw new NotFoundException(
          boardId 
            ? `Instruction medium with ID ${mediumId} not found in board ${boardId}`
            : `Instruction medium with ID ${mediumId} not found`
        );
      }

      // Check if standard exists and belongs to the board if specified
      const standard = await this.prisma.standard.findFirst({
        where: { 
          id: standardId,
          ...(boardId && { board_id: boardId })
        }
      });
      
      if (!standard) {
        throw new NotFoundException(
          boardId 
            ? `Standard with ID ${standardId} not found in board ${boardId}`
            : `Standard with ID ${standardId} not found`
        );
      }

      const where: any = {
        instruction_medium_id: mediumId,
        standard_id: standardId
      };

      // Add board filter if provided
      if (boardId) {
        where.instruction_medium = {
          board_id: boardId
        };
      }

      return await this.prisma.medium_Standard_Subject.findMany({
        where,
        select: this.mssSelect
      });
    } catch (error) {
      this.logger.error(`Failed to fetch subjects for medium ${mediumId} and standard ${standardId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch medium standard subjects');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if medium standard subject exists
      const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id },
        include: {
          teacher_subjects: true
        }
      });

      if (!mediumStandardSubject) {
        throw new NotFoundException(`Medium standard subject with ID ${id} not found`);
      }

      // Get chapters related to this subject and standard combination
      const chapters = await this.prisma.chapter.findMany({
        where: {
          subject_id: mediumStandardSubject.subject_id,
          standard_id: mediumStandardSubject.standard_id
        },
        include: {
          topics: true
        }
      });

      // Get counts of related entities for informative message
      const relatedCounts = {
        teacherSubjects: mediumStandardSubject.teacher_subjects.length,
        chapters: chapters.length,
        topics: chapters.reduce((sum, chapter) => sum + chapter.topics.length, 0)
      };

      // Log what will be deleted
      this.logger.log(`Deleting medium standard subject ${id} will also delete:
        - ${relatedCounts.teacherSubjects} teacher subject assignments
        - ${relatedCounts.chapters} chapters
        - ${relatedCounts.topics} topics
        and all their related records`);

      // Delete the medium standard subject - cascade will handle all related records
      await this.prisma.medium_Standard_Subject.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted medium standard subject ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete medium standard subject ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete medium standard subject');
    }
  }

  async findOne(id: number) {
    try {
      const mediumStandardSubject = await this.prisma.medium_Standard_Subject.findUnique({
        where: { id },
        select: this.mssSelect
      });

      if (!mediumStandardSubject) {
        throw new NotFoundException(`Medium standard subject with ID ${id} not found`);
      }

      return mediumStandardSubject;
    } catch (error) {
      this.logger.error(`Failed to fetch medium standard subject ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch medium standard subject');
    }
  }

  async getMediumsForStandardSubject(standardId: number, subjectId: number, boardId: number) {
    try {
      // Check if the standard, subject, and board exist
      const standard = await this.prisma.standard.findFirst({
        where: { 
          id: standardId,
          board_id: boardId
        }
      });
      
      if (!standard) {
        throw new NotFoundException(`Standard with ID ${standardId} not found in board ${boardId}`);
      }
      
      const subject = await this.prisma.subject.findFirst({
        where: { 
          id: subjectId,
          board_id: boardId
        }
      });
      
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${subjectId} not found in board ${boardId}`);
      }

      // Find medium standard subjects for this combination
      const mediumStandardSubjects = await this.prisma.medium_Standard_Subject.findMany({
        where: {
          standard_id: standardId,
          subject_id: subjectId,
          instruction_medium: {
            board_id: boardId
          }
        },
        include: {
          instruction_medium: true
        }
      });

      // If no medium standard subjects are found, find all available mediums for this board
      let allBoardMediums;
      
      if (mediumStandardSubjects.length === 0) {
        allBoardMediums = await this.prisma.instruction_Medium.findMany({
          where: { board_id: boardId },
          select: {
            id: true,
            instruction_medium: true
          }
        });
      }

      // Create the response
      const hasMultipleMediums = mediumStandardSubjects.length > 1;
      
      // Map the mediums
      const mediums = mediumStandardSubjects.length > 0 
        ? mediumStandardSubjects.map(mss => ({
            id: mss.instruction_medium.id,
            instruction_medium: mss.instruction_medium.instruction_medium,
            medium_standard_subject_id: mss.id
          }))
        : (allBoardMediums || []).map(medium => ({
            id: medium.id,
            instruction_medium: medium.instruction_medium
          }));
      
      return {
        has_multiple_mediums: hasMultipleMediums,
        mediums: mediums
      };
    } catch (error) {
      this.logger.error(`Failed to get mediums for standard ${standardId}, subject ${subjectId}, board ${boardId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get mediums for standard and subject');
    }
  }
} 