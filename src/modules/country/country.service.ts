import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCountryDto, UpdateCountryDto } from './dto/country.dto';
import { EntityNotFoundException } from '../../common/exceptions/entity-not-found.exception';
import { EntityAlreadyExistsException } from '../../common/exceptions/entity-already-exists.exception';

@Injectable()
export class CountryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCountryDto) {
    try {
      const existing = await this.prisma.country.findFirst({
        where: { name: createDto.name }
      });

      if (existing) {
        throw new EntityAlreadyExistsException('Country');
      }

      return await this.prisma.country.create({
        data: {
          name: createDto.name
        }
      });
    } catch (error) {
      if (error instanceof EntityAlreadyExistsException) {
        throw error;
      }
      throw new Error('Failed to create country');
    }
  }

  async findAll() {
    return this.prisma.country.findMany({
      select: {
        id: true,
        name: true
      }
    });
  }

  async findOne(id: number) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      select: {
        id: true,
        name: true
      }
    });
    
    if (!country) {
      throw new EntityNotFoundException('Country');
    }
    
    return country;
  }

  async update(id: number, updateDto: UpdateCountryDto) {
    try {
      await this.findOne(id);
      return await this.prisma.country.update({
        where: { id },
        data: updateDto
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error('Failed to update country');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.prisma.country.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete country');
    }
  }
}
