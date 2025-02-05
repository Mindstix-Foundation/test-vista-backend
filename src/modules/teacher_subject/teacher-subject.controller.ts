import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { TeacherSubjectService } from './teacher-subject.service';
import { CreateTeacherSubjectDto } from './dto/teacher-subject.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('teacher-subjects')
@Controller('teacher-subjects')
export class TeacherSubjectController {
  constructor(private readonly teacherSubjectService: TeacherSubjectService) {}

  @Post()
  @ApiOperation({ summary: 'Assign subject to teacher' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subject assigned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher, School Standard or Subject not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Assignment already exists' })
  async create(@Body() createDto: CreateTeacherSubjectDto) {
    return await this.teacherSubjectService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teacher subject assignments' })
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all assignments' })
  async findAll(@Query('teacherId', new ParseIntPipe({ optional: true })) teacherId?: number) {
    return await this.teacherSubjectService.findAll(teacherId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher subject assignment by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the assignment' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.teacherSubjectService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete teacher subject assignment' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Assignment deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.teacherSubjectService.remove(id);
  }
} 