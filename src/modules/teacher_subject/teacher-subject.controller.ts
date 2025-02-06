import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { TeacherSubjectService } from './teacher-subject.service';
import { CreateTeacherSubjectDto } from './dto/teacher-subject.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

class GetTeacherSubjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  schoolStandardId?: number;
}

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
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'schoolStandardId', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all assignments' })
  async findAll(@Query() query: GetTeacherSubjectsQueryDto) {
    return await this.teacherSubjectService.findAll({
      userId: query.userId,
      schoolStandardId: query.schoolStandardId
    });
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