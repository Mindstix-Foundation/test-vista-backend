import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStateDto, UpdateStateDto } from './dto/state.dto';
import { EntityNotFoundException } from '../../common/exceptions/entity-not-found.exception';
import { EntityAlreadyExistsException } from '../../common/exceptions/entity-already-exists.exception';

@Injectable()
export class StateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateStateDto) {
    try {
      const existing = await this.prisma.state.findFirst({
        where: { 
          name: createDto.name,
          country_id: createDto.country_id 
        }
      });

      if (existing) {
        throw new EntityAlreadyExistsException('State');
      }

      return await this.prisma.state.create({
        data: {
          name: createDto.name,
          country_id: createDto.country_id
        }
      });
    } catch (error) {
      if (error instanceof EntityAlreadyExistsException) {
        throw error;
      }
      throw new Error('Failed to create state');
    }
  }

  async findAll(countryId?: number) {
    return this.prisma.state.findMany({
      where: countryId ? { country_id: countryId } : undefined,
      select: {
        id: true,
        name: true,
        country_id: true
      }
    });
  }

  async findOne(id: number) {
    const state = await this.prisma.state.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        country_id: true
      }
    });
    
    if (!state) {
      throw new EntityNotFoundException('State');
    }
    
    return state;
  }

  async update(id: number, updateDto: UpdateStateDto) {
    try {
      await this.findOne(id);
      return await this.prisma.state.update({
        where: { id },
        data: updateDto
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error('Failed to update state');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.prisma.state.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error('Failed to delete state');
    }
  }
}
