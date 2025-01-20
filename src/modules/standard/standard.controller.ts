import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { StandardService } from './standard.service';
import { StandardDto, CreateStandardDto, UpdateStandardDto } from './dto/standard.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('standards')
@Controller('standards')
export class StandardController {
  constructor(private readonly standardService: StandardService) {}

  @Post()
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
  @ApiOperation({ summary: 'Delete a standard' })
  @ApiResponse({ 
    status: 204, 
    description: 'The standard has been successfully deleted.'
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.standardService.remove(id);
  }
} 