import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSubjectDto) {
    try {
      // Check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id: createDto.board_id }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${createDto.board_id} not found`);
      }

      // Check for duplicate subject in the same board
      const existing = await this.prisma.subject.findFirst({
        where: { 
          name: toTitleCase(createDto.name),
          board_id: createDto.board_id 
        }
      });

      if (existing) {
        throw new ConflictException(`Subject '${createDto.name}' already exists for this board`);
      }

      return await this.prisma.subject.create({
        data: {
          name: toTitleCase(createDto.name),
          board_id: createDto.board_id,
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to create subject:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create subject');
    }
  }

  async findAll() {
    try {
      return await this.prisma.subject.findMany({
        include: {
          board: true
        },
        orderBy: {
          name: 'asc' // Sort alphabetically by name
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch subjects:', error);
      throw new InternalServerErrorException('Failed to fetch subjects');
    }
  }

  async findOne(id: number) {
    try {
      const subject = await this.prisma.subject.findUnique({
        where: { id },
        include: {
          board: true
        }
      });
      
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }
      
      return subject;
    } catch (error) {
      this.logger.error(`Failed to fetch subject ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch subject');
    }
  }

  async update(id: number, updateDto: UpdateSubjectDto) {
    try {
      await this.findOne(id);

      if (updateDto.board_id) {
        const board = await this.prisma.board.findUnique({
          where: { id: updateDto.board_id }
        });

        if (!board) {
          throw new NotFoundException(`Board with ID ${updateDto.board_id} not found`);
        }

        // Check for duplicate subject in the target board
        if (updateDto.name) {
          const existing = await this.prisma.subject.findFirst({
            where: { 
              name: toTitleCase(updateDto.name),
              board_id: updateDto.board_id,
              NOT: { id }
            }
          });

          if (existing) {
            throw new ConflictException(`Subject already exists in the target board`);
          }
        }
      }
      
      return await this.prisma.subject.update({
        where: { id },
        data: {
          ...updateDto,
          name: updateDto.name ? toTitleCase(updateDto.name) : undefined,
        },
        include: {
          board: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update subject ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update subject');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if subject exists with its board
      const subject = await this.prisma.subject.findUnique({
        where: { id },
        include: {
          board: true
        }
      });

      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }

      // Get medium standard subjects
      const mediumStandardSubjects = await this.prisma.medium_Standard_Subject.findMany({
        where: { subject_id: id }
      });

      // Get teacher subjects directly related to this subject
      const teacherSubjects = await this.prisma.teacher_Subject.findMany({
        where: { subject_id: id },
        include: {
          user: true
        }
      });

      // Get chapters directly related to this subject
      const chapters = await this.prisma.chapter.findMany({
        where: { subject_id: id },
        include: {
          topics: true
        }
      });

      // Get counts of related entities for informative message
      const relatedCounts = {
        mediumStandards: mediumStandardSubjects.length,
        teachers: new Set(teacherSubjects.map(ts => ts.user_id)).size,
        chapters: chapters.length,
        topics: chapters.reduce((sum, chapter) => sum + chapter.topics.length, 0)
      };

      // Log what will be deleted
      this.logger.log(`Deleting subject ${id} (${subject.name}) from board ${subject.board.name} will also delete:
        - ${relatedCounts.mediumStandards} medium-standard combinations
        - ${relatedCounts.teachers} teacher assignments
        - ${relatedCounts.chapters} chapters
        - ${relatedCounts.topics} topics
        and all their related records`);

      // Delete the subject - cascade will handle all related records
      await this.prisma.subject.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted subject ${id} and all related records`);
    } catch (error) {
      this.logger.error(`Failed to delete subject ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete subject');
    }
  }

  async findByBoard(boardId: number) {
    return await this.prisma.subject.findMany({
      where: { board_id: boardId },
      orderBy: {
        name: 'asc' // Sort alphabetically by name
      }
    });
  }

  async findUnconnectedSubjects(boardId: number, mediumId: number, standardId: number) {
    try {
      // Validate that board exists
      const board = await this.prisma.board.findUnique({
        where: { id: boardId }
      });
      
      if (!board) {
        throw new NotFoundException(`Board with ID ${boardId} not found`);
      }

      // Validate that medium exists and belongs to the board
      const medium = await this.prisma.instruction_Medium.findFirst({
        where: { 
          id: mediumId,
          board_id: boardId 
        }
      });
      
      if (!medium) {
        throw new NotFoundException(`Instruction medium with ID ${mediumId} not found in board ${boardId}`);
      }

      // Validate that standard exists and belongs to the board
      const standard = await this.prisma.standard.findFirst({
        where: { 
          id: standardId,
          board_id: boardId 
        }
      });
      
      if (!standard) {
        throw new NotFoundException(`Standard with ID ${standardId} not found in board ${boardId}`);
      }

      // Get subjects that belong to the board but don't have a connection with the medium and standard
      const subjects = await this.prisma.subject.findMany({
        where: {
          board_id: boardId,
          NOT: {
            medium_standard_subjects: {
              some: {
                instruction_medium_id: mediumId,
                standard_id: standardId
              }
            }
          }
        },
        orderBy: {
          name: 'asc' // Sort alphabetically by name
        },
        select: {
          id: true,
          name: true
        }
      });

      return subjects;
    } catch (error) {
      this.logger.error(`Failed to fetch unconnected subjects for board ${boardId}, medium ${mediumId}, standard ${standardId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch unconnected subjects');
    }
  }

  async findSubjectsBySchoolAndStandard(schoolId: number, standardId: number) {
    try {
      // Validate that school exists
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId }
      });
      
      if (!school) {
        throw new NotFoundException(`School with ID ${schoolId} not found`);
      }

      // Validate that standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: standardId }
      });
      
      if (!standard) {
        throw new NotFoundException(`Standard with ID ${standardId} not found`);
      }

      // Get instruction mediums associated with the school
      const schoolMediums = await this.prisma.school_Instruction_Medium.findMany({
        where: { school_id: schoolId },
        select: { instruction_medium_id: true }
      });

      if (!schoolMediums.length) {
        return [];
      }

      const mediumIds = schoolMediums.map(medium => medium.instruction_medium_id);

      // Get all subjects from medium-standard-subject that match the mediums and standard
      const mediumStandardSubjects = await this.prisma.medium_Standard_Subject.findMany({
        where: {
          standard_id: standardId,
          instruction_medium_id: {
            in: mediumIds
          }
        },
        include: {
          subject: true
        },
        orderBy: {
          subject: {
            name: 'asc'
          }
        }
      });

      // Create a map to track unique subjects by ID
      const uniqueSubjectsMap = new Map();
      
      // Add each subject to the map using subject ID as the key
      mediumStandardSubjects.forEach(mss => {
        if (!uniqueSubjectsMap.has(mss.subject.id)) {
          uniqueSubjectsMap.set(mss.subject.id, {
            id: mss.subject.id,
            name: mss.subject.name
          });
        }
      });
      
      // Convert the map values to an array
      return Array.from(uniqueSubjectsMap.values());
    } catch (error) {
      this.logger.error(`Failed to fetch subjects for school ${schoolId} and standard ${standardId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch subjects for school and standard');
    }
  }

  /**
   * Finds common subjects for a given standard and instruction mediums that are assigned to the authenticated user
   * @param standardId ID of the standard
   * @param mediumIds Array of instruction medium IDs
   * @param userId ID of the authenticated user
   * @returns Array of common subjects
   */
  async findCommonSubjects(standardId: number, mediumIds: number[], userId: number) {
    try {
      // Check if standard exists
      const standard = await this.prisma.standard.findUnique({
        where: { id: standardId }
      });

      if (!standard) {
        throw new NotFoundException(`Standard with ID ${standardId} not found`);
      }

      // Check if all mediums exist
      const mediumsCount = await this.prisma.instruction_Medium.count({
        where: { id: { in: mediumIds } }
      });

      if (mediumsCount !== mediumIds.length) {
        throw new NotFoundException('One or more instruction mediums not found');
      }

      // Get subjects assigned to the user
      const userSubjects = await this.prisma.teacher_Subject.findMany({
        where: {
          user_id: userId,
          school_standard: {
            standard_id: standardId
          }
        },
        select: {
          subject_id: true
        }
      });

      if (userSubjects.length === 0) {
        return [];
      }

      const userSubjectIds = userSubjects.map(us => us.subject_id);

      if (mediumIds.length === 1) {
        // For single medium, just get subjects for that medium and standard
        const subjects = await this.prisma.medium_Standard_Subject.findMany({
          where: {
            standard_id: standardId,
            instruction_medium_id: mediumIds[0],
            subject_id: {
              in: userSubjectIds
            }
          },
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                board_id: true
              }
            }
          },
          distinct: ['subject_id'],
          orderBy: {
            subject: {
              name: 'asc'
            }
          }
        });

        return subjects.map(item => item.subject);
      } else {
        // For multiple mediums, find common subjects
        const subjectsByMedium = await Promise.all(
          mediumIds.map(mediumId => 
            this.prisma.medium_Standard_Subject.findMany({
              where: {
                standard_id: standardId,
                instruction_medium_id: mediumId,
                subject_id: {
                  in: userSubjectIds
                }
              },
              select: {
                subject_id: true
              }
            })
          )
        );

        // Extract subject IDs from each medium's results
        const subjectIdSets = subjectsByMedium.map(mediumSubjects => 
          new Set(mediumSubjects.map(s => s.subject_id))
        );

        // Find the intersection of all sets (common subject IDs)
        const commonSubjectIds = [...subjectIdSets[0]].filter(subjectId => 
          subjectIdSets.every(set => set.has(subjectId))
        );

        if (commonSubjectIds.length === 0) {
          return [];
        }

        // Fetch the full subject details for the common subject IDs
        const commonSubjects = await this.prisma.subject.findMany({
          where: {
            id: {
              in: commonSubjectIds
            }
          },
          select: {
            id: true,
            name: true,
            board_id: true
          },
          orderBy: {
            name: 'asc'
          }
        });

        return commonSubjects;
      }
    } catch (error) {
      this.logger.error('Failed to find common subjects:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to find common subjects');
    }
  }
}