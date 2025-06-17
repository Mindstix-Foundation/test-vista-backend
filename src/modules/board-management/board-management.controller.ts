import { Controller, Post, Body, Get, Param, Delete, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BoardManagementService } from './board-management.service';
import { CreateBoardManagementDto } from './dto/create-board-management.dto';
import { UpdateBoardManagementDto } from './dto/update-board-management.dto';

@ApiTags('board-management')
@ApiBearerAuth()
@Controller('board-management')
export class BoardManagementController {
  constructor(private readonly boardManagementService: BoardManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board with all related entities' })
  @ApiResponse({ status: 201, description: 'Board created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createBoardManagementDto: CreateBoardManagementDto) {
    return this.boardManagementService.create(createBoardManagementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards with their related entities' })
  @ApiResponse({ status: 200, description: 'Boards retrieved successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  findAll() {
    return this.boardManagementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific board by ID with all related entities' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({ status: 200, description: 'Board retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boardManagementService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a board and its related entities' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({ status: 200, description: 'Board updated successfully' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBoardManagementDto: UpdateBoardManagementDto) {
    return this.boardManagementService.update(id, updateBoardManagementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a board and all its related entities' })
  @ApiParam({ name: 'id', description: 'Board ID' })
  @ApiResponse({ status: 200, description: 'Board deleted successfully' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.boardManagementService.remove(id);
  }
} 