import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddressDto, CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAddressDto): Promise<AddressDto> {
    return this.prisma.address.create({
      data
    });
  }

  async findOne(id: number): Promise<AddressDto> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  async update(id: number, data: UpdateAddressDto): Promise<AddressDto> {
    try {
      return await this.prisma.address.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.address.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
  }
}
