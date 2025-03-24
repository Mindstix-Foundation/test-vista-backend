import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField, CompleteQuestionDto, EditCompleteQuestionDto, RemoveQuestionFromChapterDto } from './dto/question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Logger } from '@nestjs/common';
import { SortField } from '../../common/dto/pagination.dto';

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

  @Post('add')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Create a complete question with all related data in a single transaction',
    description: `
      Creates a complete question with all related entities in a single transaction:
      1. Creates a question record with question type and board status
      2. Creates a question topic association
      3. Creates a question text with the provided content
      4. Creates MCQ options if provided
      5. Creates match pairs if provided
      6. Creates question text topic medium association if provided
      
      All IDs for referenced entities are validated before creation.
      The is_verified field in Question_Text_Topic_Medium is always set to false for new entries.
      
      Example request body:
      \`\`\`
      {
        "question_type_id": 1,
        "board_question": true,
        "question_text_data": {
          "question_text": "What is the capital of France?",
          "image_id": 1,
          "mcq_options": [
            {
              "option_text": "Paris",
              "image_id": 5,
              "is_correct": true
            },
            {
              "option_text": "London",
              "is_correct": false
            }
          ],
          "match_pairs": [
            {
              "left_text": "France",
              "right_text": "Paris",
              "left_image_id": 1,
              "right_image_id": 2
            }
          ]
        },
        "question_topic_data": {
          "topic_id": 1
        },
        "question_text_topic_medium_data": {
          "instruction_medium_id": 1
        }
      }
      \`\`\`
    `
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Question and all related data created successfully',
    schema: {
      example: {
        id: 1,
        question_type_id: 1,
        board_question: true,
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
        question_type: {
          id: 1,
          name: "Multiple Choice",
          description: "A question with multiple choices"
        },
        question_texts: [
          {
            id: 1,
            question_id: 1,
            question_text: "What is the capital of France?",
            image_id: 1,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            mcq_options: [
              {
                id: 1,
                question_text_id: 1,
                option_text: "Paris",
                is_correct: true,
                image_id: 5
              }
            ],
            match_pairs: [
              {
                id: 1,
                question_text_id: 1,
                left_text: "France",
                right_text: "Paris",
                left_image_id: 1,
                right_image_id: 2
              }
            ],
            question_text_topics: [
              {
                id: 1,
                question_text_id: 1,
                question_topic_id: 1,
                instruction_medium_id: 1,
                is_verified: false
              }
            ]
          }
        ],
        question_topics: [
          {
            id: 1,
            question_id: 1,
            topic_id: 1,
            topic: {
              id: 1,
              name: "Geography"
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Referenced entity not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createComplete(@Body() completeDto: CompleteQuestionDto) {
    return await this.questionService.createComplete(completeDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all questions with pagination' })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number })
  @ApiQuery({ name: 'board_question', required: false, type: Boolean })
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
      instruction_medium_id,
      page,
      page_size,
      sort_by,
      sort_order,
      search
    } = filters;

    // Add diagnostic logging
    this.logger.log(`Question findAll called with params:
      - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
      - other filters: question_type_id=${question_type_id}, topic_id=${topic_id}, chapter_id=${chapter_id}
    `);

    // Map the standard SortField to QuestionSortField
    let questionSortBy: QuestionSortField;
    
    if (sort_by === SortField.CREATED_AT) {
      questionSortBy = QuestionSortField.CREATED_AT;
    } else if (sort_by === SortField.UPDATED_AT) {
      questionSortBy = QuestionSortField.UPDATED_AT;
    } else if (sort_by === SortField.NAME) {
      // Default to created_at if NAME is used (doesn't exist in Question)
      questionSortBy = QuestionSortField.CREATED_AT;
    } else {
      // If it's not a standard field, check if it's a valid question sort field
      const sortByString = typeof sort_by === 'string' ? sort_by : undefined;
      if (sortByString && Object.values(QuestionSortField).includes(sortByString as any)) {
        questionSortBy = sortByString as QuestionSortField;
      } else {
        questionSortBy = QuestionSortField.CREATED_AT;
      }
    }

    return await this.questionService.findAll({
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      instruction_medium_id,
      page,
      page_size,
      sort_by: questionSortBy,
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
      page,
      page_size,
      sort_by,
      sort_order,
      search
    } = filters;

    // Map the standard SortField to QuestionSortField
    let questionSortBy: QuestionSortField;
    
    if (sort_by === SortField.CREATED_AT) {
      questionSortBy = QuestionSortField.CREATED_AT;
    } else if (sort_by === SortField.UPDATED_AT) {
      questionSortBy = QuestionSortField.UPDATED_AT;
    } else if (sort_by === SortField.NAME) {
      // Default to created_at if NAME is used (doesn't exist in Question)
      questionSortBy = QuestionSortField.CREATED_AT;
    } else {
      // If it's not a standard field, check if it's a valid question sort field
      const sortByString = typeof sort_by === 'string' ? sort_by : undefined;
      if (sortByString && Object.values(QuestionSortField).includes(sortByString as any)) {
        questionSortBy = sortByString as QuestionSortField;
      } else {
        questionSortBy = QuestionSortField.CREATED_AT;
      }
    }

    return await this.questionService.findUntranslatedQuestions(
      mediumId,
      {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        page,
        page_size,
        sort_by: sort_by, // Use the standard sort_by from filters
        sort_order,
        search
      },
      questionSortBy, // Pass the mapped sort field as a separate parameter
      sort_order
    );
  }

  @Put('edit/:id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Edit a complete question with restricted fields in a single transaction',
    description: `
      Updates a question with selected fields in a single transaction:
      - Only board_question, question_text, image_id, and topic_id can be edited
      - MCQ options and match pairs can be updated if applicable
      - After any edit, is_verified flag is set to false in Question_Text_Topic_Medium relations
      - Requires specifying which question_text to edit via question_text_id
      
      Example request body:
      \`\`\`
      {
        "board_question": true,
        "question_text_id": 1,
        "question_text_data": {
          "question_text": "What is the capital of France?",
          "image_id": 1,
          "mcq_options": [
            {
              "id": 1,  // Include ID to update existing option, omit to create new
              "option_text": "Paris",
              "image_id": 5,
              "is_correct": true
            },
            {
              "option_text": "London",  // No ID, will create new option
              "is_correct": false
            }
          ],
          "match_pairs": [
            {
              "id": 1,  // Include ID to update existing pair, omit to create new
              "left_text": "France",
              "right_text": "Paris",
              "left_image_id": 1,
              "right_image_id": 2
            }
          ]
        },
        "question_topic_data": {
          "topic_id": 1
        }
      }
      \`\`\`
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Question and related data updated successfully',
    schema: {
      example: {
        id: 1,
        question_type_id: 1,
        board_question: true,
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
        question_type: {
          id: 1,
          name: "Multiple Choice",
          description: "A question with multiple choices"
        },
        question_texts: [
          {
            id: 1,
            question_id: 1,
            question_text: "What is the capital of France?",
            image_id: 1,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            mcq_options: [
              {
                id: 1,
                question_text_id: 1,
                option_text: "Paris",
                is_correct: true,
                image_id: 5
              }
            ],
            match_pairs: [
              {
                id: 1,
                question_text_id: 1,
                left_text: "France",
                right_text: "Paris",
                left_image_id: 1,
                right_image_id: 2
              }
            ],
            question_text_topics: [
              {
                id: 1,
                question_text_id: 1,
                question_topic_id: 1,
                instruction_medium_id: 1,
                is_verified: false
              }
            ]
          }
        ],
        question_topics: [
          {
            id: 1,
            question_id: 1,
            topic_id: 1,
            topic: {
              id: 1,
              name: "Geography"
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Question or referenced entity not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateComplete(
    @Param('id', ParseIntPipe) id: number,
    @Body() editDto: EditCompleteQuestionDto
  ) {
    return await this.questionService.updateComplete(id, editDto);
  }

  @Delete(':id/remove-from-chapter')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Remove a question from a specific chapter/topic',
    description: `
      Removes a question from a specific chapter by:
      1. Deleting question_text_topic_medium records related to the specified topic and medium
      2. Optionally deleting the question_topic association if all medium associations are removed
      3. If this was the last topic association, the entire question will be deleted
      
      Example request body:
      \`\`\`
      {
        "topic_id": 1,
        "instruction_medium_id": 1  // Optional. If omitted, all mediums for this topic will be removed
      }
      \`\`\`
      
      This operation differs from the delete endpoint as it selectively removes the question from a 
      specific chapter rather than completely deleting it from all chapters. You can:
      
      - Remove just one medium association by specifying both topic_id and instruction_medium_id
      - Remove all mediums for a topic by specifying only topic_id
      
      If all associations are removed, the question will be deleted completely.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Question removed from chapter successfully',
    schema: {
      oneOf: [
        {
          example: {
            message: "Question ID 1 partially removed from topic ID 1",
            removed_from_chapter: true,
            topic_association_deleted: false,
            medium_associations_deleted: true,
            question_deleted: false,
            mediums_removed: ["1"],
            remaining_medium_associations: 2
          },
          description: "When a specific medium is removed but other medium associations remain"
        },
        {
          example: {
            message: "Question ID 1 completely removed from topic ID 1",
            removed_from_chapter: true,
            topic_association_deleted: true,
            question_deleted: false,
            remaining_topic_count: 2,
            mediums_removed: ["1", "2"]
          },
          description: "When all mediums for a topic are removed but other topics remain"
        },
        {
          example: {
            message: "Question ID 1 completely deleted as this was the last topic association",
            removed_from_chapter: true,
            question_deleted: true,
            mediums_removed: ["1"]
          },
          description: "When the last topic association is removed, causing the question to be deleted"
        }
      ]
    }
  })
  @ApiResponse({ status: 404, description: 'Question, topic, or association not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeFromChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() removeQuestionFromChapterDto: RemoveQuestionFromChapterDto,
  ) {
    return this.questionService.removeFromChapter(id, removeQuestionFromChapterDto);
  }
}