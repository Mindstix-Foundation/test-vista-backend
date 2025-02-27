import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
    description: 'Returns all subjects'
  })
  async findAll() {
    return await this.subjectService.findAll();
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

  @Get('board/:boardId')
  @Roles('ADMIN', 'TEACHER')
  @ApiResponse({ status: 200, description: 'List of subjects for the specified board' })
  async findByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.subjectService.findByBoard(boardId);
  }
} 