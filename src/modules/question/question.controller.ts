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
      1. Checks if the same question text already exists in the database to reduce redundancy
      2. Verifies if the existing question has the same question type - if types differ, creates a new question
      3. If the question exists with same type, checks if it's already associated with the specified topic
      4. If the topic association exists, checks if it's already associated with the specified medium
      5. Creates new associations as needed or reuses existing question
      6. Creates a completely new question only if no matching text is found or question types differ
      
      This approach reduces data redundancy by allowing the same question to be reused across
      different topics and mediums. The system will:
      - Create a new question if the text doesn't exist or if the question type is different
      - Reuse an existing question by adding a new topic association if needed
      - Reuse an existing question+topic by adding a new medium association if needed
      
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
    description: 'Question and all related data created or reused successfully',
    schema: {
      oneOf: [
        {
          example: {
            id: 1,
            question_type_id: 1,
            board_question: true,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            question_type: {
              id: 1,
              type_name: "Multiple Choice",
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
          },
          description: "When a new question is created"
        },
        {
          example: {
            message: "Created new question with same text but different question type (Short Answer) than existing question",
            id: 2,
            question_type_id: 2,
            board_question: true,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            different_question_type: true
          },
          description: "When a new question is created due to different question type"
        },
        {
          example: {
            message: "Added new topic association to existing question",
            id: 1,
            question_type_id: 1,
            board_question: true,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            reused_existing_question: true
          },
          description: "When an existing question is reused with a new topic association"
        },
        {
          example: {
            message: "Added new medium association to existing question",
            id: 1,
            question_type_id: 1,
            board_question: true,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            reused_existing_question: true
          },
          description: "When an existing question is reused with a new medium association"
        },
        {
          example: {
            message: "Question with the same text already exists for topic \"Geography\" and medium \"English\"",
            existing_question: {
              id: 1
            },
            is_duplicate: true
          },
          description: "When a duplicate question is detected (same text, topic, and medium)"
        }
      ]
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
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean, description: 'Filter by verification status' })
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
      search,
      is_verified
    } = filters;

    // Add diagnostic logging
    this.logger.log(`Question findAll called with params:
      - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
      - is_verified: ${is_verified} (${typeof is_verified})
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

    // Get the full response from the service
    const fullResponse = await this.questionService.findAll({
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      instruction_medium_id,
      page,
      page_size,
      sort_by: questionSortBy,
      sort_order,
      search,
      is_verified
    });
    
    // Simplify the response to include only the needed fields
    const simplifiedData = fullResponse.data.map(question => {
      return {
        id: question.id,
        board_question: question.board_question,
        question_type: {
          id: question.question_type.id,
          type_name: question.question_type.type_name
        },
        question_texts: question.question_texts.map(text => ({
          id: text.id,
          question_id: text.question_id,
          image_id: text.image_id,
          question_text: text.question_text,
          image: text.image,
          mcq_options: text.mcq_options || [],
          match_pairs: text.match_pairs || [],
          topic: question.question_topics && question.question_topics.length > 0 
            ? {
                id: question.question_topics[0].topic?.id,
                chapter_id: question.question_topics[0].topic?.chapter_id,
                name: question.question_topics[0].topic?.name
              }
            : null
        }))
      };
    });
    
    return {
      data: simplifiedData,
      meta: fullResponse.meta
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get question by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the question with simplified data structure',
    schema: {
      example: {
        id: 15,
        board_question: true,
        question_type: {
          id: 4,
          type_name: "True or False"
        },
        question_texts: [
          {
            id: 19,
            question_id: 15,
            image_id: null,
            question_text: ".... is first human\n",
            image: {
              id: 13,
              original_filename: "join-us-banner.jpg",
              file_type: "image/jpeg",
              width: 1920,
              height: 1068,
              presigned_url: "https://test-vista-dev-image.s3.eu-north-1.amazonaws.com/images/1742808983126-join-us-banner.jpg"
            },
            mcq_options: [],
            match_pairs: [],
            topic: {
              id: 19,
              chapter_id: 7,
              name: "First Human"
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const question = await this.questionService.findOne(id);
    
    // Simplify the response to match the format of the main endpoint
    const simplifiedQuestion = {
      id: question.id,
      board_question: question.board_question,
      question_type: {
        id: question.question_type.id,
        type_name: question.question_type.type_name
      },
      question_texts: question.question_texts.map(text => ({
        id: text.id,
        question_id: text.question_id,
        image_id: text.image_id,
        question_text: text.question_text,
        image: text.image,
        mcq_options: text.mcq_options || [],
        match_pairs: text.match_pairs || [],
        topic: question.question_topics && question.question_topics.length > 0 
          ? {
              id: question.question_topics[0].topic?.id,
              chapter_id: question.question_topics[0].topic?.chapter_id,
              name: question.question_topics[0].topic?.name
            }
          : null
      }))
    };
    
    return simplifiedQuestion;
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
  @ApiOperation({ 
    summary: 'Delete a question', 
    description: `
      Completely deletes a question and all its associated data:
      - Question texts
      - MCQ options
      - Match pairs
      - Topic associations
      - Medium associations
      
      Additionally, images associated exclusively with this question (not used anywhere else)
      will be deleted from the S3 bucket to free up storage space.
      
      This is a permanent operation and cannot be undone.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Question and its unique images deleted successfully' 
  })
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
      
      The API implements data redundancy reduction:
      - Before updating, it checks if another question with the same text content already exists 
      - If a matching text is found, it may reuse that text instead of creating a duplicate
      - All associations are migrated to the existing text to maintain functionality
      - This reduces database size and improves consistency across questions
      
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
      oneOf: [
        {
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
          },
          description: "When a question is updated normally"
        },
        {
          example: {
            message: "Reused existing question text to reduce redundancy",
            id: 1,
            question_type_id: 1,
            board_question: true,
            created_at: "2023-01-01T00:00:00.000Z",
            updated_at: "2023-01-01T00:00:00.000Z",
            reused_existing_text: true
          },
          description: "When a matching question text was found and reused to reduce redundancy"
        }
      ]
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
      4. If the question is deleted, its associated images are deleted from S3 if not used elsewhere
      
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
      
      If all associations are removed, the question will be deleted completely, along with its
      unique images that aren't used by other questions.
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
            mediums_removed: ["1"],
            images_deleted: 3
          },
          description: "When the last topic association is removed, causing the question and its unique images to be deleted"
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