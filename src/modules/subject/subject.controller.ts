import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subject created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subject already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return await this.subjectService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all subjects'
  })
  async findAll() {
    return await this.subjectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subject found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.subjectService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subject' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subject updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return await this.subjectService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.subjectService.remove(id);
  }

  @Get('board/:boardId')
  @ApiResponse({ status: 200, description: 'List of subjects for the specified board' })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.subjectService.findByBoard(boardId);
  }
} 