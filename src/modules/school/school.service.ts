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

  async findAll(boardId?: number, page = 1, page_size = 15, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string, boardSearch?: string) {
    try {
      const skip = (page - 1) * page_size;
      
      // Build where clause
      let where: Prisma.SchoolWhereInput = {};
      
      // Filter by board ID if provided
      if (boardId) {
        where.board_id = parseInt(boardId.toString());
      }
      
      // Add search condition for school name
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Add search condition for board name/abbreviation
      if (boardSearch) {
        where.board = {
          OR: [
            {
              name: {
                contains: boardSearch,
                mode: 'insensitive'
              }
            },
            {
              abbreviation: {
                contains: boardSearch,
                mode: 'insensitive'
              }
            }
          ]
        };
      }
      
      // Get total count for pagination metadata
      const total = await this.prisma.school.count({ where });
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.SchoolOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get paginated data with sorting - only select essential fields
      const schools = await this.prisma.school.findMany({
        skip,
        take: page_size,
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          board: {
            select: {
              name: true,
              abbreviation: true
            }
          }
        }
      });
      
      // Transform the data to match the SchoolListDto format
      const formattedSchools = schools.map(school => ({
        id: school.id,
        name: school.name,
        board_name: school.board.name,
        board_abbreviation: school.board.abbreviation
      }));
      
      return {
        data: formattedSchools,
        meta: {
          total,
          page,
          page_size,
          total_pages: Math.ceil(total / page_size),
          sort_by,
          sort_order,
          search: search || undefined,
          boardSearch: boardSearch || undefined
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch schools:', error);
      throw new InternalServerErrorException('Failed to fetch schools');
    }
  }

  async findAllWithoutPagination(boardId?: number, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search?: string, boardSearch?: string) {
    try {
      // Build where clause
      let where: Prisma.SchoolWhereInput = {};
      
      // Filter by board ID if provided
      if (boardId) {
        where.board_id = parseInt(boardId.toString());
      }
      
      // Add search condition for school name
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        };
      }
      
      // Add search condition for board name/abbreviation
      if (boardSearch) {
        where.board = {
          OR: [
            {
              name: {
                contains: boardSearch,
                mode: 'insensitive'
              }
            },
            {
              abbreviation: {
                contains: boardSearch,
                mode: 'insensitive'
              }
            }
          ]
        };
      }
      
      // Build orderBy object based on sort parameters
      const orderBy: Prisma.SchoolOrderByWithRelationInput = {};
      orderBy[sort_by] = sort_order;
      
      // Get all schools with sorting but without pagination - only select essential fields
      const schools = await this.prisma.school.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          board: {
            select: {
              name: true,
              abbreviation: true
            }
          }
        }
      });
      
      // Transform the data to match the SchoolListDto format
      const formattedSchools = schools.map(school => ({
        id: school.id,
        name: school.name,
        board_name: school.board.name,
        board_abbreviation: school.board.abbreviation
      }));
      
      return {
        data: formattedSchools,
        meta: {
          sort_by,
          sort_order,
          search: search || undefined,
          boardSearch: boardSearch || undefined
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
        select: {
          id: true,
          name: true,
          principal_name: true,
          email: true,
          contact_number: true,
          alternate_contact_number: true,
          created_at: true,
          updated_at: true,
          board: {
            select: {
              id: true,
              name: true,
              abbreviation: true
            }
          },
          address: {
            select: {
              id: true,
              postal_code: true,
              street: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  state: {
                    select: {
                      id: true,
                      name: true,
                      country: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          // Sort instruction mediums alphabetically
          school_instruction_mediums: {
            orderBy: {
              instruction_medium: {
                instruction_medium: 'asc'
              }
            },
            select: {
              id: true,
              instruction_medium: {
                select: {
                  id: true,
                  instruction_medium: true
                }
              }
            }
          },
          // Sort standards by sequence number
          school_standards: {
            orderBy: {
              standard: {
                sequence_number: 'asc'
              }
            },
            select: {
              id: true,
              standard: {
                select: {
                  id: true,
                  name: true,
                  sequence_number: true
                }
              }
            }
          }
        }
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`);
      }

      // Transform the response to a more readable format
      return {
        id: school.id,
        name: school.name,
        principal_name: school.principal_name,
        email: school.email,
        contact_number: school.contact_number,
        alternate_contact_number: school.alternate_contact_number,
        created_at: school.created_at,
        updated_at: school.updated_at,
        board: {
          id: school.board.id,
          name: school.board.name,
          abbreviation: school.board.abbreviation
        },
        address: school.address,
        instruction_mediums: school.school_instruction_mediums.map(sim => ({
          id: sim.instruction_medium.id,
          name: sim.instruction_medium.instruction_medium
        })),
        standards: school.school_standards.map(ss => ({
          id: ss.standard.id,
          name: ss.standard.name,
          sequence_number: ss.standard.sequence_number
        }))
      };
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