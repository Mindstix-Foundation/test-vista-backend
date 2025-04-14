import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChapterMarksRangeService } from './chapter-marks-range.service';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChapterMarksRangeFilterDto, ChapterMarksRangeResponseDto } from './dto/chapter-marks-range.dto';

@ApiTags('Chapter Marks Range')
@ApiBearerAuth()
@Controller('test-paper')
@UseGuards(JwtAuthGuard)
export class ChapterMarksRangeController {
  constructor(private readonly chapterMarksRangeService: ChapterMarksRangeService) {}

  @Get('chapters/marks')
  @ApiOperation({ 
    summary: 'Get possible marks for chapters based on pattern and mediums',
    description: 'Returns an array of chapters with their possible mark combinations based on the given pattern, chapters, and mediums. The possible marks are calculated by considering available question types and their combinations.'
  })
  @ApiQuery({ 
    name: 'patternId', 
    required: true, 
    type: Number,
    description: 'ID of the pattern to use for mark calculation'
  })
  @ApiQuery({ 
    name: 'chapterIds', 
    required: true, 
    type: String,
    description: 'Comma-separated list of chapter IDs to get marks for'
  })
  @ApiQuery({ 
    name: 'mediumIds', 
    required: true, 
    type: String,
    description: 'Comma-separated list of medium IDs to filter questions by'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved chapter marks',
    type: [ChapterMarksResponseDto]
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Pattern not found'
  })
  async getChaptersWithPossibleMarks(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
  ): Promise<ChapterMarksResponseDto[]> {
    const filter: FilterChaptersDto = {
      patternId,
      chapterIds: chapterIds.split(',').map(Number),
      mediumIds: mediumIds.split(',').map(Number),
    };

    return this.chapterMarksRangeService.getChaptersWithPossibleMarks(filter);
  }

  @Get('chapters/marks/range')
  @ApiOperation({ 
    summary: 'Get possible mark ranges for chapters',
    description: 'Returns an array of chapters with their possible mark ranges based on the given pattern, chapters, and mediums. Uses bounded unique sums algorithm to calculate all possible mark combinations.'
  })
  @ApiQuery({ 
    name: 'patternId', 
    required: true, 
    type: Number,
    description: 'ID of the pattern to use for mark calculation'
  })
  @ApiQuery({ 
    name: 'chapterIds', 
    required: true, 
    type: String,
    description: 'Comma-separated list of chapter IDs to get mark ranges for'
  })
  @ApiQuery({ 
    name: 'mediumIds', 
    required: true, 
    type: String,
    description: 'Comma-separated list of medium IDs to filter questions by'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved chapter mark ranges',
    type: [ChapterMarksRangeResponseDto]
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Pattern not found'
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getChapterMarksRanges(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
  ): Promise<ChapterMarksRangeResponseDto[]> {
    const filter: ChapterMarksRangeFilterDto = {
      patternId,
      chapterIds: chapterIds.split(',').map(Number),
      mediumIds: mediumIds.split(',').map(Number),
    };

    return this.chapterMarksRangeService.getChapterMarksRanges(filter);
  }
} 