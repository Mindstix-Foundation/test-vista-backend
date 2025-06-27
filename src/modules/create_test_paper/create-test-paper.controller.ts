import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateTestPaperService } from './create-test-paper.service';
import { CreateTestPaperFilterDto, CreateTestPaperResponseDto } from './dto/create-test-paper.dto';
import { CreateOnlineTestPaperDto } from './dto/create-online-test-paper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';

@ApiTags('Test Paper Creation')
@ApiBearerAuth()
@Controller('create-test-paper')
@UseGuards(JwtAuthGuard)
export class CreateTestPaperController {
  constructor(private readonly createTestPaperService: CreateTestPaperService) {}

  @Get('online')
  @ApiOperation({ 
    summary: 'Get online test papers for the current user',
    description: 'Retrieves all online test papers created by the current user with their details including pattern, questions count, standard, and subject information.'
  })
  @ApiResponse({
    status: 200,
    description: 'Online test papers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Mathematics Test - 25/06/2024' },
          duration_minutes: { type: 'number', example: 60 },
          instructions: { type: 'string', example: 'Read all questions carefully' },
          negative_marking: { type: 'boolean', example: false },
          negative_marks_per_question: { type: 'number', example: 0.25 },
          randomize_questions: { type: 'boolean', example: false },
          randomize_options: { type: 'boolean', example: false },
          is_online: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          pattern: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              pattern_name: { type: 'string' },
              total_marks: { type: 'number' },
              standard: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Class 10' }
                }
              },
              subject: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Mathematics' }
                }
              }
            }
          },
          standard: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Class 10' }
            }
          },
          subject: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Mathematics' }
            }
          },
          question_count: { type: 'number', example: 25 },
          total_marks: { type: 'number', example: 100 },
          chapters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' }
              }
            }
          },
          school: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getOnlineTestPapers(@Request() req: any) {
    return this.createTestPaperService.getOnlineTestPapers(req.user.id);
  }

  @Post('online')
  @ApiOperation({ 
    summary: 'Create a new online test paper with optional questions',
    description: 'Creates a new online test paper that students can take directly on the platform. Optionally accepts finalized questions data to store questions in the same request.'
  })
  @ApiResponse({
    status: 201,
    description: 'Online test paper created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'Online test paper created successfully with questions finalized' 
        },
        testPaper: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Mathematics Test - 25/06/2024' },
            duration_minutes: { type: 'number', example: 60 },
            is_online: { type: 'boolean', example: true },
            question_count: { type: 'number', example: 25 },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async createOnlineTestPaper(
    @Body() createOnlineTestPaperDto: CreateOnlineTestPaperDto,
    @Request() req: any
  ) {
    return this.createTestPaperService.createOnlineTestPaper(createOnlineTestPaperDto, req.user.id);
  }

  @Get('allocation')
  @ApiOperation({ summary: 'Get test paper allocation based on pattern, chapters and mediums' })
  @ApiQuery({ name: 'patternId', type: Number, required: true })
  @ApiQuery({ name: 'chapterIds', type: [Number], required: true })
  @ApiQuery({ name: 'mediumIds', type: [Number], required: true })
  @ApiQuery({ 
    name: 'questionOrigin', 
    enum: ['board', 'other', 'both'], 
    required: false, 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)'
  })
  async getTestPaperAllocation(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
    @Query('questionOrigin') questionOrigin?: 'board' | 'other' | 'both',
  ): Promise<CreateTestPaperResponseDto> {
    const filter: CreateTestPaperFilterDto = {
      patternId,
      chapterIds: chapterIds.split(',').map(Number),
      mediumIds: mediumIds.split(',').map(Number),
      questionOrigin: questionOrigin || 'both',
    };

    return this.createTestPaperService.getTestPaperAllocation(filter);
  }

  @Get('chapters-marks')
  @ApiOperation({ summary: 'Get possible marks for each chapter based on available questions' })
  @ApiQuery({ name: 'patternId', type: Number, required: true })
  @ApiQuery({ name: 'chapterIds', type: [Number], required: true })
  @ApiQuery({ name: 'mediumIds', type: [Number], required: true })
  @ApiQuery({ 
    name: 'questionOrigin', 
    enum: ['board', 'other', 'both'], 
    required: false, 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)'
  })
  async getChaptersWithPossibleMarks(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
    @Query('questionOrigin') questionOrigin?: 'board' | 'other' | 'both',
  ): Promise<ChapterMarksResponseDto[]> {
    const filter: FilterChaptersDto = {
      patternId,
      chapterIds: chapterIds.split(',').map(Number),
      mediumIds: mediumIds.split(',').map(Number),
      questionOrigin: questionOrigin || 'both',
    };

    return this.createTestPaperService.getChaptersWithPossibleMarks(filter);
  }

  @Get('online/:id/questions')
  @ApiOperation({ 
    summary: 'Get all questions for a specific online test paper',
    description: 'Retrieves all questions associated with a specific online test paper including question text, options, images, and metadata. The test paper must belong to the authenticated user.'
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Test paper ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Test paper questions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        test_paper: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Mathematics Test - 25/06/2024' },
            duration_minutes: { type: 'number', example: 60 },
            instructions: { type: 'string', example: 'Read all questions carefully' },
            negative_marking: { type: 'boolean', example: false },
            negative_marks_per_question: { type: 'number', example: 0.25 },
            randomize_questions: { type: 'boolean', example: false },
            randomize_options: { type: 'boolean', example: false },
            pattern: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                pattern_name: { type: 'string' },
                total_marks: { type: 'number' },
                standard: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' }
                  }
                },
                subject: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' }
                  }
                }
              }
            },
            school: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' }
              }
            },
            total_questions: { type: 'number', example: 25 },
            total_marks: { type: 'number', example: 100 }
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              section_name: { type: 'string' },
              sequence_number: { type: 'number' },
              section_number: { type: 'number' },
              sub_section: { type: 'string' },
              total_questions: { type: 'number' },
              mandotory_questions: { type: 'number' },
              marks_per_question: { type: 'number' },
              subsections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    sequential_number: { type: 'number' },
                    question_type: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        type_name: { type: 'string' }
                      }
                    },
                    questions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          question_id: { type: 'number' },
                          question_text_id: { type: 'number' },
                          question_order: { type: 'number' },
                          marks: { type: 'number' },
                          is_mandatory: { type: 'boolean' },
                          question_type: {
                            type: 'object',
                            properties: {
                              id: { type: 'number' },
                              type_name: { type: 'string' }
                            }
                          },
                          question_text: { type: 'string' },
                          question_image: {
                            type: 'object',
                            nullable: true,
                            properties: {
                              id: { type: 'number' },
                              image_url: { type: 'string' },
                              original_filename: { type: 'string' }
                            }
                          },
                          chapter: {
                            type: 'object',
                            nullable: true,
                            properties: {
                              id: { type: 'number' },
                              name: { type: 'string' }
                            }
                          },
                          topic: {
                            type: 'object',
                            nullable: true,
                            properties: {
                              id: { type: 'number' },
                              name: { type: 'string' }
                            }
                          },
                          mcq_options: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'number' },
                                option_text: { type: 'string' },
                                image: {
                                  type: 'object',
                                  nullable: true,
                                  properties: {
                                    id: { type: 'number' },
                                    image_url: { type: 'string' },
                                    original_filename: { type: 'string' }
                                  }
                                },
                                is_correct: { type: 'boolean' }
                              }
                            }
                          },
                          match_pairs: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'number' },
                                left_text: { type: 'string' },
                                right_text: { type: 'string' },
                                left_image: {
                                  type: 'object',
                                  nullable: true,
                                  properties: {
                                    id: { type: 'number' },
                                    image_url: { type: 'string' },
                                    original_filename: { type: 'string' }
                                  }
                                },
                                right_image: {
                                  type: 'object',
                                  nullable: true,
                                  properties: {
                                    id: { type: 'number' },
                                    image_url: { type: 'string' },
                                    original_filename: { type: 'string' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Test paper not found or access denied'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getTestPaperQuestions(
    @Param('id') testPaperId: number,
    @Request() req: any
  ) {
    return this.createTestPaperService.getTestPaperQuestions(testPaperId, req.user.id);
  }
} 