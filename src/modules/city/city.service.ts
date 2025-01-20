import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { EntityNotFoundException } from '../../common/exceptions/entity-not-found.exception';
import { EntityAlreadyExistsException } from '../../common/exceptions/entity-already-exists.exception';

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCityDto) {
    try {
      const existing = await this.prisma.city.findFirst({
        where: { 
          name: createDto.name,
          state_id: createDto.state_id 
        }
      });

      if (existing) {
        throw new EntityAlreadyExistsException('City');
      }

      return await this.prisma.city.create({
        data: {
          name: createDto.name,
          state_id: createDto.state_id
        }
      });
    } catch (error) {
      if (error instanceof EntityAlreadyExistsException) {
        throw error;
      }
      throw new Error('Failed to create city');
    }
  }

  async findAll(stateId?: number) {
    return this.prisma.city.findMany({
      where: stateId ? { state_id: stateId } : undefined,
      select: {
        id: true,
        name: true,
        state_id: true
      }
    });
  }

  async findOne(id: number) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        state_id: true
      }
    });
    
    if (!city) {
      throw new EntityNotFoundException('City');
    }
    
    return city;
  }

  async update(id: number, updateDto: UpdateCityDto) {
    try {
      await this.findOne(id);
      return await this.prisma.city.update({
        where: { id },
        data: updateDto
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error('Failed to update city');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.prisma.city.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete city');
    }
  }
}
