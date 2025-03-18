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
  @ApiOperation({ summary: 'Get all questions with optional pagination, sorting and search' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1). If not provided, returns all questions.' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ 
    name: 'sort_by', 
    required: false, 
    enum: QuestionSortField, 
    description: 'Field to sort by (question_type_id, is_verified, board_question, question_text, created_at, updated_at)'
  })
  @ApiQuery({ 
    name: 'sort_order', 
    required: false, 
    enum: SortOrder, 
    description: 'Sort order (asc, desc)'
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter questions by content in question texts' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number, description: 'Filter by question type ID' })
  @ApiQuery({ 
    name: 'is_verified', 
    required: false, 
    enum: ['true', 'false'],
    description: 'Filter by verification status (true or false)' 
  })
  @ApiQuery({ name: 'topic_id', required: false, type: Number, description: 'Filter by topic ID' })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number, description: 'Filter by chapter ID' })
  @ApiResponse({ status: 200, description: 'Returns questions, paginated if requested' })
  async findAll(@Query() filters: QuestionFilterDto) {
    // Process the is_verified filter
    let isVerified: boolean | undefined = undefined;
    
    this.logger.log(`Raw is_verified value: ${JSON.stringify(filters.is_verified)}, type: ${typeof filters.is_verified}`);
    
    if (filters.is_verified !== undefined) {
      // Convert string to boolean
      if (filters.is_verified === 'false') {
        isVerified = false;
        this.logger.log('Setting isVerified to FALSE');
      } else if (filters.is_verified === 'true') {
        isVerified = true;
        this.logger.log('Setting isVerified to TRUE');
      } else {
        this.logger.log(`Unrecognized value for is_verified: "${filters.is_verified}"`);
      }
      
      this.logger.log(`Final is_verified value: ${isVerified}`);
    }
    
    // Handle invalid sort_by field
    let sortBy = filters.sort_by || QuestionSortField.CREATED_AT;
    
    // Map 'name' to a valid field if it's passed (for backward compatibility)
    if (sortBy === 'name') {
      sortBy = QuestionSortField.CREATED_AT;
      this.logger.log(`Mapped invalid sort field 'name' to '${sortBy}'`);
    }
    
    // Extract other filters
    const {
      question_type_id,
      topic_id,
      chapter_id,
      page,
      page_size,
      sort_order = SortOrder.DESC,
      search
    } = filters;
    
    // Log the processed filters
    this.logger.log(`Processed filters: 
      - question_type_id: ${question_type_id}
      - is_verified: ${isVerified}
      - topic_id: ${topic_id}
      - chapter_id: ${chapter_id}
      - page: ${page}
      - page_size: ${page_size}
      - sort_by: ${sortBy}
      - sort_order: ${sort_order}
      - search: ${search || 'none'}`
    );
    
    // If page and page_size are provided, use pagination
    if (page !== undefined && page_size !== undefined) {
      return await this.questionService.findAll({
        question_type_id,
        is_verified: isVerified,
        topic_id,
        chapter_id,
        page,
        page_size,
        sort_by: sortBy as QuestionSortField,
        sort_order,
        search
      });
    }
    
    // Otherwise, get all questions without pagination
    return await this.questionService.findAllWithoutPagination({
      question_type_id,
      is_verified: isVerified,
      topic_id,
      chapter_id,
      sort_by: sortBy as QuestionSortField,
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