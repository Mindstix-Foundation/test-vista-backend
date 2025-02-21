import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, Query, HttpStatus } from '@nestjs/common';
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('sections')
@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Section created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createSectionDto: CreateSectionDto) {
    return await this.sectionService.create(createSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sections with optional pattern filter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all sections' })
  @ApiQuery({ name: 'patternId', required: false, type: Number })
  async findAll(@Query('patternId') patternId?: string) {
    return await this.sectionService.findAll(patternId ? +patternId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the section' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.sectionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return await this.sectionService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.sectionService.remove(id);
  }
} 