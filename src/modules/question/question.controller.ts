import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField } from './dto/question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SortOrder } from '../../common/dto/pagination.dto';

@ApiTags('questions')
@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  async create(@Body() createDto: CreateQuestionDto) {
    return await this.questionService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all questions with optional pagination, sorting and search' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number, description: 'Filter by question type ID' })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean, description: 'Filter by verification status' })
  @ApiQuery({ name: 'topic_id', required: false, type: Number, description: 'Filter by topic ID' })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number, description: 'Filter by chapter ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1). If not provided, returns all questions.' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: QuestionSortField, description: 'Field to sort by (question_type_id, created_at, updated_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter questions by content in question texts' })
  @ApiResponse({ status: 200, description: 'Returns questions, paginated if requested' })
  async findAll(@Query() filters: QuestionFilterDto) {
    const { 
      question_type_id, 
      is_verified, 
      topic_id, 
      chapter_id, 
      page, 
      page_size, 
      sort_by = QuestionSortField.CREATED_AT, 
      sort_order = SortOrder.DESC,
      search
    } = filters;
    
    // If page and page_size are provided, use pagination
    if (page !== undefined && page_size !== undefined) {
      return await this.questionService.findAll({
        question_type_id,
        is_verified,
        topic_id,
        chapter_id,
        page,
        page_size,
        sort_by: sort_by as QuestionSortField,
        sort_order,
        search
      });
    }
    
    // Otherwise, get all questions without pagination
    return await this.questionService.findAllWithoutPagination({
      question_type_id,
      is_verified,
      topic_id,
      chapter_id,
      sort_by: sort_by as QuestionSortField,
      sort_order,
      search
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question by ID' })
  @ApiResponse({ status: 200, description: 'Returns the question' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    return await this.questionService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionService.remove(id);
  }
}