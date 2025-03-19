import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionTextService } from './question-text.service';
import { CreateQuestionTextDto, UpdateQuestionTextDto, QuestionTextFilterDto, QuestionTextSortField } from './dto/question-text.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SortOrder } from '../../common/dto/pagination.dto';

@ApiTags('question-texts')
@Controller('question-texts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionTextController {
  constructor(private readonly questionTextService: QuestionTextService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new question text' })
  @ApiResponse({ status: 201, description: 'Question text created successfully' })
  async create(@Body() createDto: CreateQuestionTextDto) {
    return await this.questionTextService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all question texts with optional pagination, sorting and search' })
  @ApiQuery({ name: 'topic_id', required: false, type: Number, description: 'Filter by topic ID' })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number, description: 'Filter by chapter ID' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number, description: 'Filter by question type ID' })
  @ApiQuery({ name: 'instruction_medium_id', required: false, type: Number, description: 'Filter by instruction medium ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1). If not provided, returns all question texts.' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: QuestionTextSortField, description: 'Field to sort by' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter question texts by content' })
  @ApiResponse({ status: 200, description: 'Returns question texts, paginated if requested' })
  async findAll(@Query() filters: QuestionTextFilterDto) {
    const { 
      topic_id, 
      chapter_id, 
      question_type_id,
      instruction_medium_id,
      page, 
      page_size, 
      sort_by = QuestionTextSortField.CREATED_AT, 
      sort_order = SortOrder.DESC,
      search
    } = filters;
    
    // If page and page_size are provided, use pagination
    if (page !== undefined && page_size !== undefined) {
      return await this.questionTextService.findAll({
        topic_id,
        chapter_id,
        question_type_id,
        instruction_medium_id,
        page,
        page_size,
        sort_by: sort_by as QuestionTextSortField,
        sort_order,
        search
      });
    }
    
    // Otherwise, get all question texts without pagination
    return await this.questionTextService.findAllWithoutPagination({
      topic_id,
      chapter_id,
      question_type_id,
      instruction_medium_id,
      sort_by: sort_by as QuestionTextSortField,
      sort_order,
      search
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question text by ID' })
  @ApiResponse({ status: 200, description: 'Returns the question text' })
  @ApiResponse({ status: 404, description: 'Question text not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTextService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update a question text' })
  @ApiResponse({ status: 200, description: 'Question text updated successfully' })
  @ApiResponse({ status: 404, description: 'Question text not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuestionTextDto,
  ) {
    return await this.questionTextService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question text' })
  @ApiResponse({ status: 200, description: 'Question text deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question text not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionTextService.remove(id);
  }

  @Get('untranslated/:mediumId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question texts that need translation to the specified medium' })
  @ApiQuery({ name: 'topic_id', required: false, type: Number, description: 'Filter by topic ID' })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number, description: 'Filter by chapter ID' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number, description: 'Filter by question type ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sort_by', required: false, enum: QuestionTextSortField, description: 'Field to sort by' })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder, description: 'Sort order (asc, desc)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter question texts by content' })
  @ApiResponse({ status: 200, description: 'Returns question texts that need translation' })
  async findUntranslatedTexts(
    @Param('mediumId', ParseIntPipe) mediumId: number,
    @Query() filters: QuestionTextFilterDto
  ) {
    const { 
      topic_id, 
      chapter_id, 
      question_type_id,
      page, 
      page_size, 
      sort_by = QuestionTextSortField.CREATED_AT, 
      sort_order = SortOrder.DESC,
      search
    } = filters;
    
    // Ensure we have a valid sort_by value
    const validSortFields = Object.values(QuestionTextSortField);
    const validatedSortBy = validSortFields.includes(sort_by as any) 
      ? sort_by as QuestionTextSortField 
      : QuestionTextSortField.CREATED_AT;
    
    return await this.questionTextService.findUntranslatedTexts(mediumId, {
      topic_id,
      chapter_id,
      question_type_id,
      page,
      page_size,
      sort_by: validatedSortBy,
      sort_order,
      search
    });
  }
} 