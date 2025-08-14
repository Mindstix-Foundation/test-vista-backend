import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

enum QuestionOrigin {
  BOARD = 'board',
  OTHER = 'other',
  BOTH = 'both'
}

// Base DTO with common fields for both endpoints
export class BaseFilterPatternDto {
  @ApiProperty({ description: 'Array of instruction medium IDs', required: true, type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(id => parseInt(id.trim(), 10));
    }
    
    if (Array.isArray(value)) {
      return value;
    } else {
      return value ? [value] : [];
    }
  })
  @Type(() => Number)
  @IsNumber({}, { each: true, message: 'Each mediumIds must be a number' })
  mediumIds: number[];

  @ApiProperty({ description: 'Array of chapter IDs', required: true, type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(id => parseInt(id.trim(), 10));
    }
    return Array.isArray(value) ? value : [value];
  })
  @Type(() => Number)
  @IsNumber({}, { each: true, message: 'Each chapterIds must be a number' })
  chapterIds: number[];

  @ApiProperty({ description: 'Question origin type (board, other, both)', required: true, enum: QuestionOrigin })
  @IsNotEmpty()
  @IsEnum(QuestionOrigin, { message: 'questionOrigin must be one of: board, other, both' })
  questionOrigin: QuestionOrigin;
}

// Used for /pattern-filter/unique-marks
export class FilterPatternDto extends BaseFilterPatternDto {}

// Used for /pattern-filter
export class FilterPatternsWithMarksDto extends BaseFilterPatternDto {
  @ApiProperty({ description: 'Total marks filter', required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt({ message: 'marks must be an integer' })
  marks: number;
} 