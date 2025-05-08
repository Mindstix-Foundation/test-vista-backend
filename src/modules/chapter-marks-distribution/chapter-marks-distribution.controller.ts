import { Controller, Get, Query, Post, Body, BadRequestException, UseInterceptors, ClassSerializerInterceptor, SerializeOptions } from '@nestjs/common';
import { ChapterMarksDistributionService } from './chapter-marks-distribution.service';
import { 
  ChapterMarksRequestDto, 
  ChapterMarksDistributionResponseDto,
  FinalQuestionsDistributionBodyDto,
  ChangeQuestionRequestDto,
  ChangeQuestionResponseDto
} from './dto/chapter-marks-distribution.dto';
import { ApiQuery, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller('chapter-marks-distribution')
@UseInterceptors(ClassSerializerInterceptor)
export class ChapterMarksDistributionController {
  constructor(private readonly chapterMarksDistributionService: ChapterMarksDistributionService) {}

  @Get('distribute')
  @ApiOperation({ summary: 'Get chapter marks distribution' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the chapter marks distribution',
    type: ChapterMarksDistributionResponseDto 
  })
  @ApiQuery({ name: 'patternId', type: 'number', required: true })
  @ApiQuery({ name: 'chapterIds', type: 'number', isArray: true, required: true })
  @ApiQuery({ name: 'mediumIds', type: 'number', isArray: true, required: true })
  @ApiQuery({ name: 'requestedMarks', type: 'number', isArray: true, required: true })
  @ApiQuery({ 
    name: 'questionOrigin', 
    enum: ['board', 'other', 'both'], 
    required: false, 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)'
  })
  async distributeChapterMarks(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
    @Query('requestedMarks') requestedMarks: string,
    @Query('questionOrigin') questionOrigin?: 'board' | 'other' | 'both'
  ): Promise<ChapterMarksDistributionResponseDto> {
    // Parse arrays from query strings
    const parsedChapterIds = chapterIds.split(',').map(id => +id);
    const parsedMediumIds = mediumIds.split(',').map(id => +id);
    const parsedRequestedMarks = requestedMarks.split(',').map(marks => +marks);

    // Validate array lengths
    if (parsedChapterIds.length !== parsedRequestedMarks.length) {
      throw new BadRequestException(
        `Number of chapters (${parsedChapterIds.length}) must match number of requested marks (${parsedRequestedMarks.length})`
      );
    }

    // Validate that all values are valid numbers
    if (parsedChapterIds.some(id => isNaN(id) || id <= 0)) {
      throw new BadRequestException('All chapter IDs must be valid positive numbers');
    }
    if (parsedMediumIds.some(id => isNaN(id) || id <= 0)) {
      throw new BadRequestException('All medium IDs must be valid positive numbers');
    }
    if (parsedRequestedMarks.some(marks => isNaN(marks) || marks < 0)) {
      throw new BadRequestException('All requested marks must be valid non-negative numbers');
    }

    const filter: ChapterMarksRequestDto = {
      patternId: +patternId,
      chapterIds: parsedChapterIds,
      mediumIds: parsedMediumIds,
      requestedMarks: parsedRequestedMarks,
      questionOrigin: questionOrigin || 'both'
    };
    
    return this.chapterMarksDistributionService.distributeChapterMarks(filter);
  }

  @Post('final-questions-distribution')
  @SerializeOptions({
    strategy: 'exposeAll'
  })
  @ApiOperation({ summary: 'Process final questions distribution for test paper' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the processed final questions distribution with actual questions',
    type: ChapterMarksDistributionResponseDto 
  })
  @ApiBody({ type: FinalQuestionsDistributionBodyDto })
  async processFinalQuestionsDistribution(
    @Body() requestBody: FinalQuestionsDistributionBodyDto
  ): Promise<ChapterMarksDistributionResponseDto> {
    return this.chapterMarksDistributionService.processFinalQuestionsDistribution(requestBody);
  }

  @Get('change-question')
  @ApiOperation({ summary: 'Get a replacement question for a test paper' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a new question to replace the existing one',
    type: ChangeQuestionResponseDto
  })
  @ApiQuery({ 
    name: 'questionTextIds', 
    type: 'array', 
    isArray: true,
    required: true, 
    description: 'Array of question text IDs to be changed',
    items: { type: 'number' }
  })
  @ApiQuery({ 
    name: 'mediumIds', 
    type: 'array', 
    isArray: true,
    required: true, 
    description: 'Array of medium IDs to get questions in specific languages',
    items: { type: 'number' }
  })
  @ApiQuery({ 
    name: 'chapterId', 
    type: 'number',
    required: true, 
    description: 'Chapter ID to find replacement questions from'
  })
  @ApiQuery({ 
    name: 'questionOrigin', 
    enum: ['board', 'other', 'both'], 
    required: false, 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)'
  })
  async changeQuestion(
    @Query('questionTextIds') questionTextIds: string,
    @Query('mediumIds') mediumIds: string,
    @Query('chapterId') chapterId: number,
    @Query('questionOrigin') questionOrigin?: 'board' | 'other' | 'both'
  ): Promise<ChangeQuestionResponseDto> {
    // Parse the query parameters - they will come as comma-separated strings
    const parsedQuestionTextIds = questionTextIds.split(',').map(id => +id);
    const parsedMediumIds = mediumIds.split(',').map(id => +id);
    
    // Validate input parameters
    if (parsedQuestionTextIds.some(id => isNaN(id) || id <= 0)) {
      throw new BadRequestException('All question text IDs must be valid positive numbers');
    }
    if (parsedMediumIds.some(id => isNaN(id) || id <= 0)) {
      throw new BadRequestException('All medium IDs must be valid positive numbers');
    }
    if (isNaN(+chapterId) || +chapterId <= 0) {
      throw new BadRequestException('Chapter ID must be a valid positive number');
    }

    const request: ChangeQuestionRequestDto = {
      questionTextIds: parsedQuestionTextIds,
      mediumIds: parsedMediumIds,
      chapterId: +chapterId,
      questionOrigin: questionOrigin || 'both'
    };
    
    return this.chapterMarksDistributionService.changeQuestion(request);
  }
} 