import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionDto } from './dto/reorder-section.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('sections')
@Controller('sections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new section' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Section created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createSectionDto: CreateSectionDto) {
    return await this.sectionService.create(createSectionDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all sections' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all sections' })
  @ApiQuery({ name: 'patternId', required: false, type: Number })
  async findAll(@Query('patternId') patternId?: string) {
    return await this.sectionService.findAll(patternId ? +patternId : undefined);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a section by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the section' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.sectionService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a section' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return await this.sectionService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.sectionService.remove(id);
  }

  @Put(':id/reorder')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reorder a section' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Section reordered successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Section not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid position' })
  async reorder(
    @Param('id', ParseIntPipe) id: number,
    @Body() reorderDto: ReorderSectionDto,
  ) {
    return await this.sectionService.reorderSection(id, reorderDto.newPosition, reorderDto.patternId);
  }
} 