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
  @ApiOperation({ summary: 'Create a new question text topic medium relation' })
  @ApiResponse({ status: 201, description: 'Relation created successfully' })
  @ApiResponse({ status: 404, description: 'Question text, question topic, or instruction medium not found' })
  @ApiResponse({ status: 409, description: 'Association already exists' })
  create(@Body() createQuestionTextTopicMediumDto: CreateQuestionTextTopicMediumDto) {
    return this.questionTextTopicMediumService.create(createQuestionTextTopicMediumDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Find all question text topic medium relations' })
  @ApiQuery({ name: 'question_text_id', required: false, type: Number })
  @ApiQuery({ name: 'question_topic_id', required: false, type: Number })
  @ApiQuery({ name: 'instruction_medium_id', required: false, type: Number })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns all relations' })
  findAll(@Query() filters: QuestionTextTopicMediumFilterDto) {
    return this.questionTextTopicMediumService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Find one question text topic medium relation by ID' })
  @ApiResponse({ status: 200, description: 'Returns the relation' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionTextTopicMediumService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update a question text topic medium relation' })
  @ApiResponse({ status: 200, description: 'Relation updated successfully' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionTextTopicMediumDto: UpdateQuestionTextTopicMediumDto,
  ) {
    return this.questionTextTopicMediumService.update(id, updateQuestionTextTopicMediumDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a question text topic medium relation' })
  @ApiResponse({ status: 200, description: 'Relation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Association not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionTextTopicMediumService.remove(id);
  }

  @Put('batch/verify')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Batch verify/unverify questions' })
  @ApiResponse({ status: 200, description: 'Updated verification status for multiple records' })
  batchUpdateVerificationStatus(@Body() batchUpdateDto: { ids: number[], is_verified: boolean }) {
    return this.questionTextTopicMediumService.batchUpdateVerificationStatus(
      batchUpdateDto.ids,
      batchUpdateDto.is_verified
    );
  }
} 