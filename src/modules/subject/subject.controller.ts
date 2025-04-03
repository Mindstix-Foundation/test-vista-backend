import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, UseGuards, Query, ValidationPipe } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto, UnconnectedSubjectsQueryDto, SchoolStandardSubjectsQueryDto } from './dto/subject.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('subjects')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subject created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subject already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return await this.subjectService.create(createSubjectDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all subjects sorted alphabetically by name'
  })
  async findAll() {
    return await this.subjectService.findAll();
  }

  @Get('unconnected')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get subjects not connected to a medium and standard',
    description: 'Returns subjects that belong to the specified board but don\'t have an association with the given medium and standard'
  })
  @ApiQuery({ name: 'board_id', required: true, type: Number, description: 'Board ID' })
  @ApiQuery({ name: 'medium_id', required: true, type: Number, description: 'Instruction Medium ID' })
  @ApiQuery({ name: 'standard_id', required: true, type: Number, description: 'Standard ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns subjects that don\'t have a connection with the medium and standard, sorted alphabetically',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Physics' }
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Board, Medium, or Standard not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input parameters' })
  async findUnconnectedSubjects(
    @Query(new ValidationPipe({ transform: true })) query: UnconnectedSubjectsQueryDto
  ) {
    return await this.subjectService.findUnconnectedSubjects(
      query.board_id,
      query.medium_id,
      query.standard_id
    );
  }

  @Get('board/:boardId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get subjects by board',
    description: 'Returns subjects for the specified board, sorted alphabetically by name'
  })
  @ApiResponse({ status: 200, description: 'List of subjects for the specified board, sorted alphabetically' })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.subjectService.findByBoard(boardId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get a subject by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Subject found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.subjectService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
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
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.subjectService.remove(id);
  }

  @Get('school-standard')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get subjects by school and standard',
    description: 'Returns unique subjects for the specified school and standard based on the mediums associated with the school'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns unique subjects for the specified school and standard, sorted alphabetically by name',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Physics' }
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School or Standard not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input parameters' })
  async findSubjectsBySchoolAndStandard(
    @Query(new ValidationPipe({ transform: true })) query: SchoolStandardSubjectsQueryDto
  ) {
    return await this.subjectService.findSubjectsBySchoolAndStandard(
      query.school_id,
      query.standard_id
    );
  }
} 