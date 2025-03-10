import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Patch } from '@nestjs/common';
import { StandardService } from './standard.service';
import { StandardDto, CreateStandardDto, UpdateStandardDto } from './dto/standard.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReorderStandardDto } from './dto/reorder-standard.dto';

@ApiTags('standards')
@Controller('standards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StandardController {
  constructor(private readonly standardService: StandardService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create standard' })
  @ApiResponse({ 
    status: 201, 
    description: 'The standard has been successfully created.',
    type: StandardDto
  })
  create(@Body() createStandardDto: CreateStandardDto): Promise<StandardDto> {
    return this.standardService.create(createStandardDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all standards' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all standards',
    type: StandardDto,
    isArray: true
  })
  findAll(): Promise<StandardDto[]> {
    return this.standardService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a standard by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a standard by id',
    type: StandardDto
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<StandardDto> {
    return this.standardService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a standard' })
  @ApiResponse({ 
    status: 200, 
    description: 'The standard has been successfully updated.',
    type: StandardDto
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStandardDto: UpdateStandardDto,
  ): Promise<StandardDto> {
    return this.standardService.update(id, updateStandardDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a standard' })
  @ApiResponse({ 
    status: 204, 
    description: 'The standard has been successfully deleted.'
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.standardService.remove(id);
  }

  @Get('board/:boardId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get standards by board id' })
  @ApiResponse({ status: 200, description: 'List of standards for the specified board' })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.standardService.findByBoard(boardId);
  }

  @Put(':id/reorder')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reorder a standard by changing its sequence number' })
  @ApiParam({ name: 'id', description: 'Standard ID' })
  @ApiResponse({ status: 200, description: 'The standard has been successfully reordered.' })
  @ApiResponse({ status: 404, description: 'Standard not found.' })
  @ApiResponse({ status: 400, description: 'Invalid sequence number or board ID.' })
  @ApiResponse({ status: 409, description: 'Conflict with existing data.' })
  async reorder(
    @Param('id', ParseIntPipe) id: number,
    @Body() reorderStandardDto: ReorderStandardDto
  ) {
    return await this.standardService.reorderStandard(
      id, 
      reorderStandardDto.newPosition, 
      reorderStandardDto.boardId
    );
  }
} 