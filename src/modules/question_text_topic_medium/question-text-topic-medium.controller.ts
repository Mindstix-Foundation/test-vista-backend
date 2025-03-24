import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Patch } from '@nestjs/common';
import { QuestionTextTopicMediumService } from './question-text-topic-medium.service';
import { CreateQuestionTextTopicMediumDto, UpdateQuestionTextTopicMediumDto, QuestionTextTopicMediumFilterDto, VerifyQuestionsDto, SimpleVerifyQuestionsDto } from './dto/question-text-topic-medium.dto';
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

  @Patch('verify')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Verify or unverify a specific question',
    description: `
      Update the verification status of a specific question identified by all required fields.
      
      This endpoint requires all identifiers to ensure precise verification of a single question:
      - Question ID - identifies the specific question
      - Question Text ID - identifies the specific question text
      - Topic ID - identifies the specific topic
      - Instruction Medium ID - identifies the specific medium
      
      All identifiers must be provided to ensure that only one specific question is verified at a time.
      
      Example request body:
      \`\`\`
      {
        "question_id": 123,
        "question_text_id": 456,
        "topic_id": 789,
        "instruction_medium_id": 101,
        "is_verified": true
      }
      \`\`\`
      
      When is_verified is set to true, the specified question will be marked as verified.
      When is_verified is set to false, the specified question will be marked as unverified.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully updated verification status',
    schema: {
      example: {
        message: "Successfully verified the question",
        affected: 1,
        is_verified: true,
        details: {
          question_id: 123,
          question_text_id: 456,
          topic_id: 789,
          topic_name: "Geography",
          instruction_medium_id: 101,
          medium_name: "English",
          question_text: "What is the capital of France?..."
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'No question found matching the specified criteria' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  verifyQuestions(@Body() verifyDto: SimpleVerifyQuestionsDto) {
    return this.questionTextTopicMediumService.setVerificationStatus(verifyDto);
  }

  // Support legacy format for backward compatibility
  @Patch('batch-verify')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Batch verify/unverify questions by IDs',
    description: 'Updates verification status for multiple question text topic medium records by their IDs.'
  })
  @ApiResponse({ status: 200, description: 'Successfully updated verification status' })
  @ApiResponse({ status: 404, description: 'One or more entries not found' })
  batchVerifyQuestions(@Body() verifyDto: VerifyQuestionsDto) {
    return this.questionTextTopicMediumService.batchUpdateVerificationStatus(
      verifyDto.ids,
      verifyDto.is_verified
    );
  }
} 