import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardDto, CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('boards')
@Controller('boards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Board created successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - requires ADMIN role' })
  async create(@Body() createBoardDto: CreateBoardDto) {
    return await this.boardService.create(createBoardDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all boards' })
  findAll(): Promise<BoardDto[]> {
    return this.boardService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a board by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a board' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a board' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.boardService.remove(id);
  }
}
