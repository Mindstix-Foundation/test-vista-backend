import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateAddressDto) {
    try {
      if (!createDto.city_id) {
        throw new BadRequestException('City ID is required');
      }

      const city = await this.prisma.city.findUnique({
        where: { id: createDto.city_id },
        include: {
          state: {
            include: {
              country: true
            }
          }
        }
      });

      if (!city) {
        throw new NotFoundException(`City with ID ${createDto.city_id} not found`);
      }

      return await this.prisma.address.create({
        data: {
          street: createDto.street,
          postal_code: createDto.postal_code,
          city: {
            connect: { id: createDto.city_id }
          }
        },
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
      });
    } catch (error) {
      this.logger.error('Failed to create address:', error);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            throw new ConflictException('Address already exists');
          case 'P2003':
            throw new BadRequestException('Invalid city reference');
          default:
            throw new InternalServerErrorException('Database error occurred');
        }
      }
      throw new InternalServerErrorException('Failed to create address');
    }
  }

  async findAll() {
    try {
      return await this.prisma.address.findMany({
        include: {
          city: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch addresses:', error);
      throw new InternalServerErrorException('Failed to fetch addresses');
    }
  }

  async findOne(id: number) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      include: {
        city: true
      }
    });
    
    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
    
    return address;
  }

  async update(id: number, updateDto: UpdateAddressDto) {
    try {
      await this.findOne(id);

      if (updateDto.city_id) {
        const city = await this.prisma.city.findUnique({
          where: { id: updateDto.city_id }
        });

        if (!city) {
          throw new NotFoundException(`City with ID ${updateDto.city_id} not found`);
        }
      }

      return await this.prisma.address.update({
        where: { id },
        data: {
          street: updateDto.street,
          postal_code: updateDto.postal_code,
          city: updateDto.city_id ? {
            connect: { id: updateDto.city_id }
          } : undefined
        },
        include: {
          city: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update address ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update address');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if address exists
      const address = await this.prisma.address.findUnique({
        where: { id },
        include: {
          board: true,
          school: true
        }
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      // Check if address is associated with a board or school
      if (address.board || address.school) {
        throw new ConflictException(
          `Cannot delete address as it is associated with a ${address.board ? 'board' : 'school'}`
        );
      }

      // Delete the address - cascade will handle related records
      await this.prisma.address.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to delete address ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete address');
    }
  }
}
