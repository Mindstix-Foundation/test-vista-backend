import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { Prisma } from '@prisma/client';
import { toTitleCase } from '../../utils/titleCase';
import { SortField, SortOrder } from '../../common/dto/pagination.dto';

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
          school_standards: {
            include: {
              standard: true
            }
          },
          school_instruction_mediums: {
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

  async findAll(boardId?: number, page = 1, page_size = 15, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string) {
    try {
      const skip = (page - 1) * page_size;
      
      // Build where clause
      const where: Prisma.SchoolWhereInput = {};
      if (boardId) {
        where.board_id = parseInt(boardId.toString());
      }
      
      // Add search condition
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.school.count({ where });
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.SchoolOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get paginated data with sorting
      const schools = await this.prisma.school.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
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
          school_standards: {
            include: {
              standard: true
            }
          },
          school_instruction_mediums: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
      
      return {
        data: schools,
        meta: {
          total,
          page,
          page_size,
          total_pages: Math.ceil(total / page_size),
          sort_by,
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all schools:', error);
      throw new InternalServerErrorException('Failed to fetch all schools');
    }
  }

  async findAllWithoutPagination(boardId?: number, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string) {
    try {
      // Build where clause
      const where: Prisma.SchoolWhereInput = {};
      if (boardId) {
        where.board_id = parseInt(boardId.toString());
      }
      
      // Add search condition
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.SchoolOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get all schools with sorting but without pagination
      const schools = await this.prisma.school.findMany({
        where,
        orderBy,
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
          school_standards: {
            include: {
              standard: true
            }
          },
          school_instruction_mediums: {
            include: {
              instruction_medium: true
            }
          }
        }
      });
      
      return {
        data: schools,
        meta: {
          sort_by,
          sort_order,
          search: search || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch all schools:', error);
      throw new InternalServerErrorException('Failed to fetch all schools');
    }
  }

  async findOne(id: number) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id },
        include: {
          address: true,
          board: true,
          school_standards: {
            include: {
              standard: true
            }
          },
          school_instruction_mediums: {
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
          school_standards: {
            include: {
              standard: true
            }
          },
          school_instruction_mediums: {
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

  async remove(id: number): Promise<void> {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id },
        include: {
          school_standards: {
            include: {
              teacher_subjects: true
            }
          },
          school_instruction_mediums: true,
          user_schools: true
        }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`);
      }

      const relatedCounts = {
        standards: school.school_standards.length,
        teachers: new Set(school.school_standards.flatMap(ss => 
          ss.teacher_subjects.map(ts => ts.user_id)
        )).size,
        instructionMediums: school.school_instruction_mediums.length,
        users: school.user_schools.length
      };

      this.logger.log(`Deleting school ${id} will also delete:
        - ${relatedCounts.standards} standard assignments
        - ${relatedCounts.teachers} teacher assignments
        - ${relatedCounts.instructionMediums} instruction medium assignments
        - ${relatedCounts.users} user associations
        and all their related records`);

      await this.prisma.school.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete school ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete school');
    }
  }
}