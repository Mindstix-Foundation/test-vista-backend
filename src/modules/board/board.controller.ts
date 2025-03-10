import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, UseGuards, Query } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardDto, CreateBoardDto, UpdateBoardDto, BoardListDto } from './dto/board.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto, SortField, SortOrder } from '../../common/dto/pagination.dto';

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
  @ApiOperation({ summary: 'Get all boards with optional pagination, sorting and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1). If not provided, returns all boards.' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: SortField, description: 'Field to sort by (name, created_at, updated_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter boards by name' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns boards, paginated if requested',
    type: BoardListDto,
    isArray: true
  })
  findAll(@Query() paginationDto: PaginationDto) {
    // Extract values from DTO without defaults
    const { page, page_size, sort_by = SortField.NAME, sort_order = SortOrder.ASC, search } = paginationDto;
    
    // If page and page_size are explicitly provided in the query parameters, use pagination
    if (page !== undefined && page_size !== undefined) {
      return this.boardService.findAll(page, page_size, sort_by, sort_order, search);
    }
    
    // Otherwise, get all boards without pagination
    return this.boardService.findAllWithoutPagination(sort_by, sort_order, search);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get a board by id',
    description: 'Returns board details with address, instruction mediums (alphabetical), standards (by sequence), and subjects (alphabetical)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns board details with properly sorted related data'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board not found' })
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
