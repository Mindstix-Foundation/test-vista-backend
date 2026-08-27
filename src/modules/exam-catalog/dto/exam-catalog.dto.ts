import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ExamCategoryCode {
  BOARD = 'BOARD',
  ENTRANCE = 'ENTRANCE',
  COMPETITIVE = 'COMPETITIVE',
}

export enum ExamBodyJurisdiction {
  NATIONAL = 'NATIONAL',
  STATE = 'STATE',
  INSTITUTIONAL = 'INSTITUTIONAL',
}

export class CreateExamBodyDto {
  @ApiProperty({ example: 'Union Public Service Commission' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'UPSC' })
  @IsString()
  @IsNotEmpty()
  abbreviation: string;

  @ApiProperty({ example: 3, description: 'Exam category ID' })
  @IsNumber()
  exam_category_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({ required: false, description: 'Legacy school board ID to link' })
  @IsOptional()
  @IsNumber()
  board_id?: number;

  @ApiProperty({ required: false, enum: ExamBodyJurisdiction })
  @IsOptional()
  @IsEnum(ExamBodyJurisdiction)
  jurisdiction?: ExamBodyJurisdiction;
}

export class UpdateExamBodyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  abbreviation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  exam_category_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false, enum: ExamBodyJurisdiction })
  @IsOptional()
  @IsEnum(ExamBodyJurisdiction)
  jurisdiction?: ExamBodyJurisdiction;
}

export class CreateExamProgramDto {
  @ApiProperty({ example: 1, description: 'Exam body ID' })
  @IsNumber()
  exam_body_id: number;

  @ApiProperty({ example: 'Civil Services Examination' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'UPSC_CSE' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 120 })
  @IsOptional()
  @IsNumber()
  default_duration_minutes?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  has_negative_marking?: boolean;

  @ApiProperty({ required: false, example: 0.33, description: 'Fraction of marks deducted per wrong answer' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  negative_marks_ratio?: number;
}

export class UpdateExamProgramDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  default_duration_minutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  has_negative_marking?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  negative_marks_ratio?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateExamStageDto {
  @ApiProperty({ example: 1, description: 'Exam program ID' })
  @IsNumber()
  exam_program_id: number;

  @ApiProperty({ example: 'Prelims - GS Paper I' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  sequence_number: number;

  @ApiProperty({ required: false, example: false, description: 'Qualifying-only stage (e.g. CSAT)' })
  @IsOptional()
  @IsBoolean()
  is_qualifying?: boolean;

  @ApiProperty({ required: false, example: 33 })
  @IsOptional()
  @IsNumber()
  qualifying_pct?: number;
}

export class UpdateExamStageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sequence_number?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_qualifying?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  qualifying_pct?: number;
}

export class ExamCatalogFilterDto {
  @ApiProperty({ required: false, enum: ExamCategoryCode })
  @IsOptional()
  @IsEnum(ExamCategoryCode)
  category?: ExamCategoryCode;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_body_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_program_id?: number;
}
