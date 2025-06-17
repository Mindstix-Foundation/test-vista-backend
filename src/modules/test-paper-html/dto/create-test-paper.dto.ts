import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/**
 * Enum for the origin type of test papers
 */
export enum TestPaperOriginType {
  /** Test paper originated from a board/education authority */
  BOARD = 'board',
  /** Test paper originated from another source (teacher/school created) */
  OTHER = 'other',
  /** Test paper combines content from both board and other sources */
  BOTH = 'both'
}

/**
 * DTO for chapter with weightage mapping
 */
export class ChapterWeightageDto {
  @ApiProperty({
    description: 'ID of the chapter',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  chapter_id: number;

  @ApiProperty({
    description: 'Weightage of the chapter in the test paper',
    example: 30,
  })
  @IsNumber()
  @Type(() => Number)
  weightage: number;
}

/**
 * DTO for instruction medium with PDF content mapping
 */
export class InstructionMediumPdfDto {
  @ApiProperty({
    description: 'ID of the instruction medium (language)',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  instruction_medium_id: number;

  @ApiProperty({
    description: 'Whether this medium should be set as the default for the test paper',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default_medium?: boolean;

  @ApiProperty({
    description: 'Custom filename for the stored file. If not provided, a default name will be generated.',
    example: 'math-test-q1-2025.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  filename?: string;
}

/**
 * DTO for creating a test paper with content (PDF files for multiple mediums)
 */
export class TestPaperDto {
  @ApiProperty({
    description: 'Name/title of the test paper',
    example: 'Mathematics Quarterly Test - Q1 2025',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Duration of the exam in human-readable format (e.g., "1 hour 45 minutes")',
    example: '1 hour 45 minutes',
  })
  @IsString()
  exam_time: string;

  @ApiProperty({
    description: 'ID of the pattern (question structure) to use for this test paper',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  pattern_id: number;

  @ApiProperty({
    description: 'Origin type of the test paper - board, other source, or both',
    example: 'board',
    enum: TestPaperOriginType,
    required: false,
  })
  @IsEnum(TestPaperOriginType)
  @IsOptional()
  test_paper_origin_type?: TestPaperOriginType;

  @ApiProperty({
    description: 'Array of chapter IDs (must match with weightages by position)',
    type: [Number],
    example: [1, 2, 3, 4],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON
        return JSON.parse(value).map(Number);
      } catch (e) {
        // Try to parse as comma-separated values
        return value.split(',').map(v => Number(v.trim()));
      }
    }
    return Array.isArray(value) ? value.map(Number) : [];
  })
  chapters: number[];

  @ApiProperty({
    description: 'Array of weightages for each chapter (must match with chapters by position)',
    type: [Number],
    example: [30, 40, 15, 15],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON
        return JSON.parse(value).map(Number);
      } catch (e) {
        // Try to parse as comma-separated values
        return value.split(',').map(v => Number(v.trim()));
      }
    }
    return Array.isArray(value) ? value.map(Number) : [];
  })
  weightages: number[];

  @ApiProperty({
    description: 'Array of instruction medium IDs (must match with uploaded files by position, first medium is default)',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON
        return JSON.parse(value).map(Number);
      } catch (e) {
        // Try to parse as comma-separated values
        return value.split(',').map(v => Number(v.trim()));
      }
    }
    return Array.isArray(value) ? value.map(Number) : [];
  })
  instruction_mediums: number[];
} 