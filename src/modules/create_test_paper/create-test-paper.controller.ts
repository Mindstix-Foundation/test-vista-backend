import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CreateTestPaperService } from './create-test-paper.service';
import { CreateTestPaperFilterDto, CreateTestPaperResponseDto } from './dto/create-test-paper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterChaptersDto } from './dto/filter-chapters.dto';
import { ChapterMarksResponseDto } from './dto/chapter-marks-response.dto';

@ApiTags('Test Paper Creation')
@ApiBearerAuth()
@Controller('test-paper')
@UseGuards(JwtAuthGuard)
export class CreateTestPaperController {
  constructor(private readonly createTestPaperService: CreateTestPaperService) {}

  @Get('allocation')
  @ApiOperation({ summary: 'Get test paper allocation based on pattern, chapters and mediums' })
  @ApiQuery({ name: 'patternId', type: Number, required: true })
  @ApiQuery({ name: 'chapterIds', type: [Number], required: true })
  @ApiQuery({ name: 'mediumIds', type: [Number], required: true })
  async getTestPaperAllocation(
    @Query('patternId') patternId: number,
    @Query('chapterIds') chapterIds: string,
    @Query('mediumIds') mediumIds: string,
  ): Promise<CreateTestPaperResponseDto> {
    const filter: CreateTestPaperFilterDto = {
      patternId,
      chapterIds: chapterIds.split(',').map(Number),
      mediumIds: mediumIds.split(',').map(Number),
    };

    return this.createTestPaperService.getTestPaperAllocation(filter);
  }

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

    return this.createTestPaperService.getChaptersWithPossibleMarks(filter);
  }
} 