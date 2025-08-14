import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PatternFilterService } from './pattern-filter.service';
import { FilterPatternDto, FilterPatternsWithMarksDto } from './dto/filter-pattern.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('pattern-filter')
@Controller('pattern-filter')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PatternFilterController {
  private readonly logger = new Logger(PatternFilterController.name);

  constructor(private readonly patternFilterService: PatternFilterService) {}

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Filter patterns by medium, chapters, question origin, and total marks',
    description: `
      Returns patterns that have enough questions of required types in the selected chapters.
      
      This endpoint analyzes each pattern's sections and their required question types.
      It checks if the selected chapters contain at least 2 times the number of questions needed
      for each question type.
      
      For example, if a section in a pattern requires 3 questions of type ID 2,
      the selected chapters must have at least 6 questions of that type.
      
      The response includes valid patterns that meet all requirements, as well as
      information about invalid patterns that don't have enough questions.
      
      All filters must be provided to narrow down the results.
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: `Returns filtered patterns with:
      - count: Number of valid patterns
      - patterns: Array of valid pattern objects with their details (without timestamps)
      - invalidPatternsCount: Number of invalid patterns
      - invalidPatterns: Array of objects explaining why patterns were invalid` 
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input parameters' })
  @ApiQuery({ name: 'mediumIds', required: true, type: [Number], description: 'Comma-separated list of instruction medium IDs to filter by' })
  @ApiQuery({ name: 'chapterIds', required: true, type: [Number], description: 'Comma-separated list of chapter IDs to check for question availability' })
  @ApiQuery({ name: 'questionOrigin', required: true, enum: ['board', 'other', 'both'], description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)' })
  @ApiQuery({ name: 'marks', required: true, type: Number, description: 'Total marks to filter patterns by' })
  async filterPatterns(@Query() filterDto: FilterPatternsWithMarksDto) {
    this.logger.log(`Filtering patterns with criteria: ${JSON.stringify(filterDto)}`);
    return await this.patternFilterService.filterPatterns(filterDto);
  }

  @Get('/unique-marks')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get unique marks from patterns matching filter criteria',
    description: `
      Returns a list of unique total marks values from patterns that meet the filter criteria.
      
      This endpoint is useful for populating dropdown menus or other UI components that need
      to display available mark options based on the selected filters.
      
      It applies the same filtering logic as the main endpoint to ensure that marks are only
      included if there are patterns with those marks that have enough questions of the required types.
      A pattern is considered valid if it has at least 2 times the required number of questions
      for each question type in each section.
      
      The marks are returned as a sorted array of unique values.
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: `Returns:
      - count: Number of unique mark values
      - marks: Sorted array of unique mark values` 
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input parameters' })
  @ApiQuery({ name: 'mediumIds', required: true, type: [Number], description: 'Comma-separated list of instruction medium IDs to filter by' })
  @ApiQuery({ name: 'chapterIds', required: true, type: [Number], description: 'Comma-separated list of chapter IDs to check for question availability' })
  @ApiQuery({ name: 'questionOrigin', required: true, enum: ['board', 'other', 'both'], description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)' })
  async getUniqueMarks(@Query() filterDto: FilterPatternDto) {
    this.logger.log(`Getting unique marks with criteria: ${JSON.stringify(filterDto)}`);
    return await this.patternFilterService.getUniqueMarks(filterDto);
  }
} 