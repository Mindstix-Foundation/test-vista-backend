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
} 