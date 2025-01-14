import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StateDto } from './dto/state.dto';

@Injectable()
export class StateService {
  constructor(private prisma: PrismaService) {}

  async findAll(countryId?: number): Promise<StateDto[]> {
    return this.prisma.state.findMany({
      where: countryId ? {
        country_id: countryId
      } : undefined
    });
  }

  async findOne(id: number): Promise<StateDto> {
    const state = await this.prisma.state.findUnique({
      where: { id },
    });

    if (!state) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }

    return state;
  }
}
