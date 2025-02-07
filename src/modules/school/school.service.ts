import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { Prisma } from '@prisma/client';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSchoolDto) {
    try {
      // Check if address is available
      const address = await this.prisma.address.findUnique({
        where: { id: createDto.address_id }
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${createDto.address_id} not found`);
      }

      // Check if address is already used by another school
      const existingSchool = await this.prisma.school.findUnique({
        where: { address_id: createDto.address_id }
      });

      if (existingSchool) {
        throw new ConflictException(`Address with ID ${createDto.address_id} is already associated with another school`);
      }

      // Check if board exists
      const board = await this.prisma.board.findUnique({
        where: { id: createDto.board_id }
      });

      if (!board) {
        throw new NotFoundException(`Board with ID ${createDto.board_id} not found`);
      }

      return await this.prisma.school.create({
        data: {
          name: toTitleCase(createDto.name),
          board_id: createDto.board_id,
          address_id: createDto.address_id,
          principal_name: toTitleCase(createDto.principal_name),
          email: createDto.email,
          contact_number: createDto.contact_number,
          alternate_contact_number: createDto.alternate_contact_number
        },
        include: {
          address: true,
          board: true,
          School_Standard: {
            include: {
              standard: true
            }
          },
          School_Instruction_Medium: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to create school:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('School with this name already exists');
        }
      }
      throw new InternalServerErrorException('Failed to create school');
    }
  }

  async findAll(boardId?: number) {
    try {
      return await this.prisma.school.findMany({
        where: boardId ? { board_id: boardId } : undefined,
        include: {
          address: {
            include: {
              city: {
                include: {
                  state: {
                    include: {
                      country: true
                    }
                  }
                }
              }
            }
          },
          board: true,
          School_Standard: {
            include: {
              standard: true
            }
          },
          School_Instruction_Medium: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch schools:', error);
      throw new InternalServerErrorException('Failed to fetch schools');
    }
  }

  async findOne(id: number) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id },
        include: {
          address: true,
          board: true,
          School_Standard: {
            include: {
              standard: true
            }
          },
          School_Instruction_Medium: {
            include: {
              instruction_medium: true
            }
          }
        }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`);
      }

      return school;
    } catch (error) {
      this.logger.error(`Failed to fetch school ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch school');
    }
  }

  async update(id: number, updateDto: UpdateSchoolDto) {
    try {
      await this.findOne(id);

      if (updateDto.address_id) {
        const address = await this.prisma.address.findUnique({
          where: { id: updateDto.address_id }
        });

        if (!address) {
          throw new NotFoundException(`Address with ID ${updateDto.address_id} not found`);
        }

        // Check if address is used by another school
        const existingSchool = await this.prisma.school.findFirst({
          where: { 
            address_id: updateDto.address_id,
            NOT: { id }
          }
        });

        if (existingSchool) {
          throw new ConflictException(`Address with ID ${updateDto.address_id} is already associated with another school`);
        }
      }

      if (updateDto.board_id) {
        const board = await this.prisma.board.findUnique({
          where: { id: updateDto.board_id }
        });

        if (!board) {
          throw new NotFoundException(`Board with ID ${updateDto.board_id} not found`);
        }
      }

      return await this.prisma.school.update({
        where: { id },
        data: {
          name: updateDto.name ? toTitleCase(updateDto.name) : undefined,
          board_id: updateDto.board_id,
          address_id: updateDto.address_id,
          principal_name: updateDto.principal_name ? toTitleCase(updateDto.principal_name) : undefined,
          email: updateDto.email,
          contact_number: updateDto.contact_number,
          alternate_contact_number: updateDto.alternate_contact_number
        },
        include: {
          address: true,
          board: true,
          School_Standard: {
            include: {
              standard: true
            }
          },
          School_Instruction_Medium: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to update school:', error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update school');
    }
  }

  async remove(id: number) {
    try {
      // First check if school exists
      const school = await this.prisma.school.findUnique({
        where: { id }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`);
      }

      // Check for associated teachers (users)
      const teacherCount = await this.prisma.user_School.count({
        where: { 
          school_id: id,
          user: {
            user_roles: {
              some: {
                role: {
                  role_name: 'TEACHER'
                }
              }
            }
          }
        }
      });

      if (teacherCount > 0) {
        throw new ConflictException(
          `Cannot delete school as it is associated with ${teacherCount} teacher${teacherCount > 1 ? 's' : ''}`
        );
      }

      // Start transaction for cascading delete
      await this.prisma.$transaction(async (prisma) => {
        // First delete all teacher subjects associated with school standards
        await prisma.teacher_Subject.deleteMany({
          where: {
            school_standard: {
              school_id: id
            }
          }
        });

        // Delete school standards
        await prisma.school_Standard.deleteMany({
          where: { school_id: id }
        });

        // Delete school instruction mediums
        await prisma.school_Instruction_Medium.deleteMany({
          where: { school_id: id }
        });

        // Delete user school associations
        await prisma.user_School.deleteMany({
          where: { school_id: id }
        });

        // Finally delete the school
        await prisma.school.delete({
          where: { id }
        });
      });

    } catch (error) {
      this.logger.error(`Failed to delete school ${id}:`, error);
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete school');
    }
  }
}