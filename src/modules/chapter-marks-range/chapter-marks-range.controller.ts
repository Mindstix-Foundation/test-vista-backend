import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChapterMarksRangeService } from './chapter-marks-range.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChapterMarksRangeFilterDto, ChapterMarksRangeResponseDto } from './dto/chapter-marks-range.dto';

@ApiTags('Chapter Marks Range')
@ApiBearerAuth()
@Controller('test-paper')
@UseGuards(JwtAuthGuard)
export class ChapterMarksRangeController {
  constructor(private readonly chapterMarksRangeService: ChapterMarksRangeService) {}

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
  @ApiQuery({ 
    name: 'questionOrigin', 
    required: false, 
    type: String,
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)',
    enum: ['board', 'other', 'both'],
    example: 'both'
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
    @Query('patternId') patternIdStr: string,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
    @Query('questionOrigin') questionOrigin: 'board' | 'other' | 'both' = 'both',
  ): Promise<ChapterMarksRangeResponseDto[]> {
    // Parse and validate patternId
    const patternId = parseInt(patternIdStr, 10);
    if (isNaN(patternId) || patternId <= 0) {
      throw new BadRequestException('Invalid pattern ID provided');
    }

    // Parse and validate chapterIds
    if (!chapterIds || chapterIds.trim() === '') {
      throw new BadRequestException('Chapter IDs are required');
    }
    const parsedChapterIds = chapterIds.split(',').map(id => {
      const parsed = parseInt(id.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new BadRequestException(`Invalid chapter ID: ${id}`);
      }
      return parsed;
    });

    // Parse and validate mediumIds
    if (!mediumIds || mediumIds.trim() === '') {
      throw new BadRequestException('Medium IDs are required');
    }
    const parsedMediumIds = mediumIds.split(',').map(id => {
      const parsed = parseInt(id.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new BadRequestException(`Invalid medium ID: ${id}`);
      }
      return parsed;
    });

    const filter: ChapterMarksRangeFilterDto = {
      patternId,
      chapterIds: parsedChapterIds,
      mediumIds: parsedMediumIds,
      questionOrigin,
    };

    return this.chapterMarksRangeService.getChapterMarksRanges(filter);
  }
} 