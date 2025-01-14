import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardDto, CreateBoardDto, UpdateBoardDto } from './dto/board.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('boards')
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @ApiOperation({ summary: 'Create board' })
  @ApiResponse({ 
    status: 201, 
    description: 'The board has been successfully created.',
    type: BoardDto
  })
  create(@Body() createBoardDto: CreateBoardDto): Promise<BoardDto> {
    return this.boardService.create(createBoardDto);
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
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a board by id',
    type: BoardDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Board not found'
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BoardDto> {
    return this.boardService.findOne(id);
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
  @ApiOperation({ summary: 'Delete a board' })
  @ApiResponse({ 
    status: 204, 
    description: 'The board has been successfully deleted.'
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.boardService.remove(id);
  }
}
