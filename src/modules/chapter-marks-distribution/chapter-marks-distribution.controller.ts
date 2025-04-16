import { Controller, Get, Query, Post, Body, BadRequestException, UseInterceptors, ClassSerializerInterceptor, SerializeOptions } from '@nestjs/common';
import { ChapterMarksDistributionService } from './chapter-marks-distribution.service';
import { 
  ChapterMarksRequestDto, 
  ChapterMarksDistributionResponseDto,
  FinalQuestionsDistributionBodyDto
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
  async distributeChapterMarks(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
    @Query('requestedMarks') requestedMarks: string
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
      requestedMarks: parsedRequestedMarks
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
} 