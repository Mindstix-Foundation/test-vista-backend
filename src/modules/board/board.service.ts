import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardDto, CreateBoardDto, UpdateBoardDto } from './dto/board.dto';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBoardDto): Promise<BoardDto> {
    return this.prisma.board.create({
      data
    });
  }

  async findAll(): Promise<BoardDto[]> {
    return this.prisma.board.findMany();
  }

  async findOne(id: number): Promise<BoardDto> {
    const board = await this.prisma.board.findUnique({
      where: { id },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    return board;
  }

  async update(id: number, data: UpdateBoardDto): Promise<BoardDto> {
    try {
      return await this.prisma.board.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.board.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
  }
}
