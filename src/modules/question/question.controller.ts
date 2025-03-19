import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField } from './dto/question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Logger } from '@nestjs/common';

@ApiTags('questions')
@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionController {
  private readonly logger = new Logger(QuestionController.name);

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
  @ApiOperation({ summary: 'Get all questions with pagination' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number })
  @ApiQuery({ name: 'board_question', required: false, type: Boolean })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean })
  @ApiQuery({ name: 'instruction_medium_id', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false, enum: QuestionSortField })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns paginated questions' })
  async findAll(@Query() filters: QuestionFilterDto) {
    const {
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      is_verified,
      instruction_medium_id,
      page,
      page_size,
      sort_by,
      sort_order,
      search
    } = filters;

    return await this.questionService.findAll({
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      is_verified,
      instruction_medium_id,
      page,
      page_size,
      sort_by: sort_by as unknown as QuestionSortField,
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

  @Get('untranslated/:mediumId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get questions not translated in specified medium' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number })
  @ApiQuery({ name: 'board_question', required: false, type: Boolean })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false, enum: QuestionSortField })
  @ApiQuery({ name: 'sort_order', required: false, enum: SortOrder })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns untranslated questions for the specified medium' })
  async findUntranslatedQuestions(
    @Param('mediumId', ParseIntPipe) mediumId: number,
    @Query() filters: QuestionFilterDto
  ) {
    const {
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      is_verified,
      page,
      page_size,
      sort_by,
      sort_order,
      search
    } = filters;

    // Ensure we have a valid sort_by value
    const validSortFields = Object.values(QuestionSortField);
    const validatedSortBy = validSortFields.includes(sort_by as any) 
      ? sort_by as unknown as QuestionSortField 
      : QuestionSortField.CREATED_AT;

    return await this.questionService.findUntranslatedQuestions(mediumId, {
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      is_verified,
      page,
      page_size,
      sort_by: validatedSortBy,
      sort_order,
      search
    });
  }
}