import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CountryDto } from './dto/country.dto';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<CountryDto[]> {
    return this.prisma.country.findMany();
  }

  async findOne(id: number): Promise<CountryDto> {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return country;
  }
}
