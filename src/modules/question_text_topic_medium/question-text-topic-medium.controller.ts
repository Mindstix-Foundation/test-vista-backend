import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionTextTopicMediumService } from './question-text-topic-medium.service';
import { CreateQuestionTextTopicMediumDto, UpdateQuestionTextTopicMediumDto, QuestionTextTopicMediumFilterDto } from './dto/question-text-topic-medium.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('question-text-topic-medium')
@Controller('question-text-topic-medium')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuestionTextTopicMediumController {
  constructor(private readonly questionTextTopicMediumService: QuestionTextTopicMediumService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new question text topic medium association' })
  @ApiResponse({ status: 201, description: 'Association created successfully' })
  @ApiResponse({ status: 404, description: 'Question text, question topic, or instruction medium not found' })
  @ApiResponse({ status: 409, description: 'Association already exists' })
  async create(@Body() createDto: CreateQuestionTextTopicMediumDto) {
    return await this.questionTextTopicMediumService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all question text topic medium associations' })
  @ApiQuery({ name: 'question_text_id', required: false, type: Number })
  @ApiQuery({ name: 'question_topic_id', required: false, type: Number })
  @ApiQuery({ name: 'instruction_medium_id', required: false, type: Number })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean })
  async findAll(@Query() filters: QuestionTextTopicMediumFilterDto) {
    return await this.questionTextTopicMediumService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question text topic medium association by ID' })
  @ApiResponse({ status: 200, description: 'Returns the association' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.questionTextTopicMediumService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update a question text topic medium association' })
  @ApiResponse({ status: 200, description: 'Association updated successfully' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuestionTextTopicMediumDto
  ) {
    return await this.questionTextTopicMediumService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question text topic medium association' })
  @ApiResponse({ status: 200, description: 'Association deleted successfully' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionTextTopicMediumService.remove(id);
  }
} 