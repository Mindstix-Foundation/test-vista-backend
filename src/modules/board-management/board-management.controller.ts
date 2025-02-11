import { Controller, Post, Body, Get, Param, Delete, ParseIntPipe, Put, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BoardManagementService } from './board-management.service';
import { CreateBoardManagementDto } from './dto/create-board-management.dto';
import { UpdateBoardManagementDto } from './dto/update-board-management.dto';

@ApiTags('board-management')
@Controller('board-management')
export class BoardManagementController {
  constructor(private readonly boardManagementService: BoardManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board with all related entities' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Board and related entities created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Entity already exists' 
  })
  async create(@Body() createDto: CreateBoardManagementDto) {
    return await this.boardManagementService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards with related entities' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all boards with their related entities' 
  })
  async findAll() {
    return await this.boardManagementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board by id with related entities' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns a board with its related entities' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Board not found' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.boardManagementService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a board and its related entities' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Board and related entities deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Board not found' 
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.boardManagementService.remove(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a board and its related entities' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Board and related entities updated successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Board not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBoardManagementDto,
  ) {
    return await this.boardManagementService.update(id, updateDto);
  }
} 