import { Controller, Post, Body, Get, Param, Delete, ParseIntPipe, Put, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoardManagementService } from './board-management.service';
import { CreateBoardManagementDto } from './dto/create-board-management.dto';
import { UpdateBoardManagementDto } from './dto/update-board-management.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('board-management')
@Controller('board-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BoardManagementController {
  constructor(private readonly boardManagementService: BoardManagementService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new board with all related entities' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Board and related entities created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async create(@Body() createDto: CreateBoardManagementDto) {
    return await this.boardManagementService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all boards with their related entities' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all boards and their related entities' 
  })
  async findAll() {
    return await this.boardManagementService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a board and its related entities by id' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the board and its related entities' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Board not found' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.boardManagementService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
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
  @Roles('ADMIN')
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