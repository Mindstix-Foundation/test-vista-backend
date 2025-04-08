import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Patch, DefaultValuePipe, Logger } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, CompleteQuestionDto, QuestionSortField, EditCompleteQuestionDto, RemoveQuestionFromChapterDto, AddTranslationDto, QuestionCountFilterDto } from './dto/question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SortOrder } from '../../common/dto/pagination.dto';

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
      
      Important: This API implements an image comparison strategy for duplicate detection:
      - Questions with the same text but different images are treated as distinct entities
      - Image uniqueness is determined by comparing image_ids (simplified file hash)
      - When a user submits a question with the same text and type but different image, a new question will be created
      - This approach avoids duplicates while ensuring questions with different visual content are preserved
      
      This approach reduces data redundancy by allowing the same question to be reused across
      different topics and mediums while ensuring questions with different visual content are preserved.
      The system will:
      - Create a new question if the text doesn't exist, if the question type is different, or if the image differs
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

  @Get('count')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Count questions with essential filters',
    description: 'Returns the total count of questions matching the specified filters (chapter_id, instruction_medium_id, is_verified), without retrieving the full question data'
  })
  @ApiQuery({ 
    name: 'chapter_id', 
    required: false, 
    type: Number,
    description: 'Filter questions by chapter ID' 
  })
  @ApiQuery({ 
    name: 'instruction_medium_id', 
    required: false, 
    type: Number,
    description: 'Filter questions by instruction medium ID (e.g., English, Hindi, etc.)' 
  })
  @ApiQuery({ 
    name: 'is_verified', 
    required: false, 
    type: Boolean, 
    description: 'Filter by verification status of questions (true/false)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the count of questions matching the specified filters',
    schema: {
      type: 'object',
      properties: {
        count: { 
          type: 'number', 
          example: 42,
          description: 'The number of questions matching the filters'
        },
        filters: {
          type: 'object',
          description: 'The filters that were applied to the count',
          properties: {
            chapter_id: { type: 'number', nullable: true },
            instruction_medium_id: { type: 'number', nullable: true },
            is_verified: { type: 'boolean', nullable: true }
          }
        }
      }
    }
  })
  async countQuestions(@Query() filters: QuestionCountFilterDto) {
    this.logger.log(`countQuestions called with filters: ${JSON.stringify(filters)}`);
    
    return await this.questionService.countQuestions(filters);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get all questions with pagination',
    description: 'Retrieves questions with comprehensive filtering capabilities. Supports filtering by question type, topic, chapter, verification status, medium, and search text. Results can be paginated and sorted by various fields.'
  })
  @ApiQuery({ 
    name: 'question_type_id', 
    required: false, 
    type: Number,
    description: 'Filter questions by specific question type ID (e.g., MCQ, Match Pairs, etc.)' 
  })
  @ApiQuery({ 
    name: 'topic_id', 
    required: false, 
    type: Number,
    description: 'Filter questions by specific topic ID' 
  })
  @ApiQuery({ 
    name: 'chapter_id', 
    required: false, 
    type: Number,
    description: 'Filter questions by chapter ID' 
  })
  @ApiQuery({ 
    name: 'board_question', 
    required: false, 
    type: Boolean,
    description: 'Filter questions by board question status (true/false)' 
  })
  @ApiQuery({ 
    name: 'instruction_medium_id', 
    required: false, 
    type: Number,
    description: 'Filter questions by instruction medium ID (e.g., English, Hindi, etc.)' 
  })
  @ApiQuery({ 
    name: 'is_verified', 
    required: false, 
    type: Boolean, 
    description: 'Filter by verification status of questions (true/false)' 
  })
  @ApiQuery({ 
    name: 'translation_status', 
    required: false, 
    type: String,
    description: 'Filter questions by translation status' 
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number for pagination (default: 1)' 
  })
  @ApiQuery({ 
    name: 'page_size', 
    required: false, 
    type: Number,
    description: 'Number of items per page (default: 10)' 
  })
  @ApiQuery({ 
    name: 'sort_by', 
    required: false, 
    enum: ['question_type_id', 'question_text', 'created_at', 'updated_at'],
    description: 'Field to sort by: question_type_id, question_text, created_at (of the question text), updated_at (of the question text)' 
  })
  @ApiQuery({ 
    name: 'sort_order', 
    required: false, 
    enum: ['asc', 'desc'],
    description: 'Sort order: ascending (asc) or descending (desc)' 
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String,
    description: 'Search term to filter questions by text content (case-insensitive)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated questions with filtered results based on provided criteria' 
  })
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
      is_verified,
      translation_status
    } = filters;

    // Add detailed diagnostic logging
    this.logger.log(`Question findAll called with params:
      - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
      - is_verified: ${is_verified} (${typeof is_verified})
      - translation_status: ${translation_status} (${typeof translation_status})
      - other filters: question_type_id=${question_type_id}, topic_id=${topic_id}, chapter_id=${chapter_id}
      - all filters: ${JSON.stringify(filters)}
    `);

    // Get the full response from the service - the topics should already be set correctly
    return await this.questionService.findAll({
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
      is_verified,
      translation_status
    });
  }

  @Get('untranslated/:mediumId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get questions not translated in specified medium',
    description: `
      Retrieves all questions that do not have any translation (verified or unverified)
      in the specified instruction medium.
      
      This endpoint is useful for finding content that needs to be translated.
      
      You can filter by:
      - question_type_id: Find questions of a specific type
      - topic_id: Find questions for a specific topic
      - chapter_id: Find questions for a specific chapter
      - board_question: Filter by board question flag
      - is_verified: When true, returns only questions with verified texts in other mediums
      
      The response is paginated and can be sorted by different fields.
    `
  })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number })
  @ApiQuery({ name: 'board_question', required: false, type: Boolean })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean, description: 'When true, only returns questions with verified texts in other mediums' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ 
    name: 'sort_by', 
    required: false, 
    enum: ['question_type_id', 'question_text', 'created_at', 'updated_at'],
    description: 'Field to sort by: question_type_id, question_text, created_at (of the question text), updated_at (of the question text)' 
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['asc', 'desc'] })
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
      search,
      is_verified,
      translation_status
    } = filters;

    // Add diagnostic logging
    this.logger.log(`findUntranslatedQuestions called with params:
      - medium_id: ${mediumId}
      - filters: ${JSON.stringify(filters)}
      - sort_by: ${sort_by} (${typeof sort_by})
      - sort_order: ${sort_order} (${typeof sort_order})
      - is_verified: ${is_verified} (${typeof is_verified})
      - translation_status: ${translation_status} (${typeof translation_status})
    `);

    // The result from the service already includes transformed image data with presigned URLs
    return await this.questionService.findUntranslatedQuestions(
      mediumId,
      {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        page,
        page_size,
        sort_by,
        sort_order,
        search,
        is_verified,
        translation_status
      }
    );
  }

  @Get('untranslated/:mediumId/count')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Count untranslated questions for a specific medium',
    description: 'Returns the count of questions that have not been translated to the specified medium'
  })
  @ApiParam({ 
    name: 'mediumId', 
    type: Number, 
    description: 'ID of the instruction medium to check for untranslated questions',
    required: true
  })
  @ApiQuery({ name: 'question_type_id', required: false, type: Number })
  @ApiQuery({ name: 'topic_id', required: false, type: Number })
  @ApiQuery({ name: 'chapter_id', required: false, type: Number })
  @ApiQuery({ name: 'board_question', required: false, type: Boolean })
  @ApiQuery({ name: 'is_verified', required: false, type: Boolean, description: 'When true, only counts questions with verified texts in other mediums' })
  @ApiQuery({ name: 'translation_status', required: false, enum: ['original', 'translated'], description: 'Filter by translation status: "original" or "translated"' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the count of untranslated questions for the specified medium',
    schema: {
      type: 'object',
      properties: {
        count: { 
          type: 'number', 
          example: 42,
          description: 'The number of questions not translated to the specified medium'
        },
        medium_id: { 
          type: 'number', 
          example: 1,
          description: 'The ID of the medium requested'
        },
        filters: {
          type: 'object',
          description: 'The filters that were applied to the count',
          properties: {
            question_type_id: { type: 'number', nullable: true },
            topic_id: { type: 'number', nullable: true },
            chapter_id: { type: 'number', nullable: true },
            board_question: { type: 'boolean', nullable: true },
            is_verified: { type: 'boolean', nullable: true },
            translation_status: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  async countUntranslatedQuestions(
    @Param('mediumId', ParseIntPipe) mediumId: number,
    @Query() filters: QuestionFilterDto
  ) {
    const {
      question_type_id,
      topic_id,
      chapter_id,
      board_question,
      is_verified,
      translation_status
    } = filters;

    this.logger.log(`countUntranslatedQuestions called with params:
      - medium_id: ${mediumId}
      - filters: ${JSON.stringify(filters)}
    `);

    return await this.questionService.countUntranslatedQuestions(
      mediumId,
      {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        is_verified,
        translation_status
      }
    );
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
    // The question service already handles topic associations and transformations
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
      
      *** IMPORTANT TRANSLATION WORKFLOW NOTICE ***
      When the original text (translation_status = "original") is edited, all related translations 
      in other languages will be AUTOMATICALLY UNVERIFIED (is_verified = false). This critical feature ensures:
      1. Translators are notified to review and update their translations 
      2. Outdated translations aren't presented to users as verified content
      3. Content consistency is maintained across all languages
      4. The response will include the count of unverified translations as "translations_unverified"
      
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
            message: "Question updated successfully. 3 related translations were unverified.",
            id: 1,
            question_type_id: 1,
            board_question: true,
            translations_unverified: 3
          },
          description: "When an original text is edited and related translations are unverified"
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
  @ApiOperation({ 
    summary: 'Update a complete question with all related data in a single transaction',
    description: `
      Updates a complete question with all related entities in a single transaction:
      1. Updates the base question properties if provided
      2. Updates the question text and manages any associated entities (MCQ options, match pairs)
      3. If needed, creates new associations for topics or mediums
      
      *** TRANSLATION INTEGRITY FEATURE ***
      When editing the original text (with translation_status="original"), the system automatically
      unverifies ALL related translations (sets is_verified=false). This critical workflow feature:
      
      - Ensures translators know when source content has changed and requires review
      - Prevents outdated translations from being served to users
      - Maintains educational content integrity across all language versions
      - Provides a clear translation workflow with verification states
      
      The response includes a "translations_unverified" count showing how many translations
      were affected by this automatic process.
      
      This API implements an image comparison strategy for question text management:
      - When updating a question with a new image, the system evaluates whether to create a new question text entry
      - Questions with the same text but different images are treated as distinct entities
      - Image uniqueness is determined by comparing image_ids (simplified file hash)
      - This preserves different visual representations of the same question text
      
      The update process follows these rules:
      - If the question text changes, a new question text entry is always created
      - If only the image changes (same text), a new question text entry is created
      - If neither text nor image changes, the existing question text is reused
      
      This approach maintains data integrity by preserving questions with different visual content
      while reducing redundancy where appropriate.
      
      All IDs for referenced entities are validated before updating.
    `
  })
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

  @Post(':id/translate')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Add a translation for an existing question',
    description: `
      Creates a translation for an existing verified question:
      1. Uses the specified question ID and creates a new question text entry
      2. Maintains the same question relationship (question_id) 
      3. Creates a new entry in question_text_topic_medium table with:
         - The new question text ID
         - The specified instruction medium ID (target language)
         - The existing question_topic ID
         - Sets is_verified to false (as this is a new translation)
      
      Important notes about images:
      - If the original question has an image, the translation MUST include an image_id
      - If the original question has no image, the translation should NOT include an image_id
      - This consistency is enforced to maintain educational content quality
      
      For MCQ and matching questions, translations for options/pairs must be provided.
      
      Example request body:
      \`\`\`
      {
        "question_text": "Qual é a capital da França?", // Translated text
        "image_id": 2,                                 // Image for translated version
        "instruction_medium_id": 3,                    // Target language medium ID
        "mcq_options": [                               // Translated options (for MCQ)
          {
            "option_text": "Paris",
            "image_id": 5,
            "is_correct": true
          },
          {
            "option_text": "Londres",
            "is_correct": false
          }
        ],
        "match_pairs": [                               // Translated pairs (for matching)
          {
            "left_text": "França",
            "right_text": "Paris"
          }
        ]
      }
      \`\`\`
    `
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Translation added successfully',
    schema: {
      example: {
        message: "Translation added successfully",
        id: 1,                      // Original question ID
        question_text_id: 2,        // Newly created question text ID
        question_text: "Qual é a capital da França?",
        instruction_medium_id: 3,   // Target language ID
        medium_name: "Portuguese"
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or image consistency issue' })
  @ApiResponse({ status: 404, description: 'Question not found or not verified in source language' })
  @ApiResponse({ status: 409, description: 'Translation already exists for this question and medium' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async addTranslation(
    @Param('id', ParseIntPipe) id: number,
    @Body() translationDto: AddTranslationDto
  ) {
    return await this.questionService.addTranslation(id, translationDto);
  }

  @Get(':id/topic/:topicId/verified-texts')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get verified question texts for a specific question and topic',
    description: `
      Retrieves all verified question texts for a specific question and topic combination.
      The response includes:
      1. Basic question information (id, question_type, board_question)
      2. Topic information
      3. All verified question texts with their respective images
      4. Medium information for each text
      
      The question texts are sorted alphabetically by medium name.
      
      This endpoint is useful for getting an overview of available translations for a question
      in a specific topic context.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Retrieved verified question texts successfully',
    schema: {
      example: {
        id: 1,
        question_type: {
          id: 1,
          type_name: "Multiple Choice"
        },
        board_question: true,
        topic: {
          id: 5,
          name: "Geography",
          chapter_id: 3
        },
        question_texts: [
          {
            id: 2,
            question_text: "What is the capital of France?",
            image_id: 1,
            image: {
              id: 1,
              original_filename: "paris.jpg",
              presigned_url: "https://example.com/images/paris.jpg"
            },
            medium: {
              id: 1,
              instruction_medium: "English"
            },
            mcq_options: [
              {
                id: 1,
                option_text: "Paris",
                is_correct: true
              },
              {
                id: 2,
                option_text: "London",
                is_correct: false
              }
            ],
            match_pairs: []
          },
          {
            id: 3,
            question_text: "¿Cuál es la capital de Francia?",
            image_id: 2,
            image: {
              id: 2,
              original_filename: "paris_es.jpg",
              presigned_url: "https://example.com/images/paris_es.jpg"
            },
            medium: {
              id: 2,
              instruction_medium: "Spanish"
            },
            mcq_options: [
              {
                id: 3,
                option_text: "París",
                is_correct: true
              },
              {
                id: 4,
                option_text: "Londres",
                is_correct: false
              }
            ],
            match_pairs: []
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Question or topic not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getVerifiedQuestionTexts(
    @Param('id', ParseIntPipe) id: number,
    @Param('topicId', ParseIntPipe) topicId: number
  ) {
    return await this.questionService.getVerifiedQuestionTexts(id, topicId);
  }

  @Get('diagnostic/:id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Diagnostic endpoint to check question structure' })
  async checkQuestionData(@Param('id', ParseIntPipe) id: number) {
    return await this.questionService.checkQuestionData(id);
  }
  
  @Get('diagnostic')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Diagnostic endpoint to check all questions structure' })
  async checkAllQuestionsData() {
    return await this.questionService.checkAllQuestionsData();
  }

  @Post('assign-default-topics')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Assign a default topic to all questions without topics',
    description: `
      This is a utility endpoint to fix questions that don't have any topics assigned.
      It will:
      1. Find all questions without topic associations
      2. Create a default 'General' topic if it doesn't exist
      3. Associate each question with the default topic
      4. Create question_text_topic_medium records for each question text
      
      This is helpful for ensuring all questions have a topic, which is needed
      for proper functioning of the system.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Default topics assigned successfully',
    schema: {
      example: {
        message: "Created topic associations for 5 questions",
        affected: 5,
        defaultTopic: {
          id: 1,
          name: "General",
          chapter_id: 1
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async assignDefaultTopicToQuestions() {
    return await this.questionService.assignDefaultTopicToQuestions();
  }
}