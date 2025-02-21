import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, Query, HttpStatus } from '@nestjs/common';
import { SubsectionQuestionTypeService } from './subsection-question-type.service';
import { CreateSubsectionQuestionTypeDto } from './dto/create-subsection-question-type.dto';
import { UpdateSubsectionQuestionTypeDto } from './dto/update-subsection-question-type.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('subsection-question-types')
@Controller('subsection-question-types')
export class SubsectionQuestionTypeController {
  constructor(private readonly subsectionQuestionTypeService: SubsectionQuestionTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subsection question type' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subsection question type created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createDto: CreateSubsectionQuestionTypeDto) {
    return await this.subsectionQuestionTypeService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subsection question types with optional section filter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all subsection question types' })
  @ApiQuery({ name: 'sectionId', required: false, type: Number })
  async findAll(@Query('sectionId') sectionId?: string) {
    return await this.subsectionQuestionTypeService.findAll(sectionId ? +sectionId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subsection question type by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the subsection question type' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subsection question type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.subsectionQuestionTypeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subsection question type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subsection question type updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subsection question type not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSubsectionQuestionTypeDto,
  ) {
    return await this.subsectionQuestionTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subsection question type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subsection question type deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subsection question type not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.subsectionQuestionTypeService.remove(id);
  }
} 