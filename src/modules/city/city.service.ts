import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CityDto } from './dto/city.dto';

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  async findAll(stateId?: number): Promise<CityDto[]> {
    return this.prisma.city.findMany({
      where: stateId ? {
        state_id: stateId
      } : undefined
    });
  }

  async findOne(id: number): Promise<CityDto> {
    const city = await this.prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return city;
  }
}
