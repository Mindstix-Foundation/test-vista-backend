import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardDto, CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('boards')
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Board created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Board already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createBoardDto: CreateBoardDto) {
    return await this.boardService.create(createBoardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all boards',
    type: BoardDto,
    isArray: true
  })
  findAll(): Promise<BoardDto[]> {
    return this.boardService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Board found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  async findOne(@Param('id') id: number) {
    return await this.boardService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a board' })
  @ApiResponse({ 
    status: 200, 
    description: 'The board has been successfully updated.',
    type: BoardDto
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<BoardDto> {
    return this.boardService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a board' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Board deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
  async remove(@Param('id') id: number) {
    await this.boardService.remove(id);
  }
}
