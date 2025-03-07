import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionTopicService } from './question-topic.service';
import { CreateQuestionTopicDto, QuestionTopicFilterDto } from './dto/question-topic.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('question-topics')
@Controller('question-topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionTopicController {
  constructor(private readonly questionTopicService: QuestionTopicService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new question-topic association' })
  @ApiResponse({ status: 201, description: 'Association created successfully' })
  @ApiResponse({ status: 404, description: 'Question or topic not found' })
  @ApiResponse({ status: 409, description: 'Association already exists' })
  async create(@Body() createDto: CreateQuestionTopicDto) {
    return await this.questionTopicService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all question-topic associations' })
  @ApiQuery({ name: 'question_id', required: false, type: Number })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number })
  async findAll(@Query() filters: QuestionTopicFilterDto) {
    return await this.questionTopicService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question-topic association by ID' })
  @ApiResponse({ status: 200, description: 'Returns the association' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTopicService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question-topic association' })
  @ApiResponse({ status: 200, description: 'Association deleted successfully' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionTopicService.remove(id);
  }
} 