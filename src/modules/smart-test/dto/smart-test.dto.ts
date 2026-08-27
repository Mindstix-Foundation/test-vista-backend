import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type QuestionOrigin = 'board' | 'other' | 'both';

export class SmartTestChapterMarksDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  chapter_id: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  marks: number;
}

export class CreateBoardSmartTestDto {
  @ApiProperty({ example: 'Mathematics Smart Test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ type: [Number], example: [1] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  medium_ids: number[];

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  subject_id: number;

  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  chapter_ids: number[];

  @ApiProperty({ enum: ['board', 'other', 'both'], example: 'both' })
  @IsString()
  @IsIn(['board', 'other', 'both'])
  question_source: QuestionOrigin;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  pattern_id: number;

  @ApiProperty({
    required: false,
    type: [SmartTestChapterMarksDto],
    description:
      'Optional per-chapter marks weightage. When omitted, marks are distributed equally.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SmartTestChapterMarksDto)
  chapter_marks?: SmartTestChapterMarksDto[];

  @ApiProperty({ example: 60, minimum: 1, maximum: 300 })
  @IsInt()
  @Min(1)
  @Max(300)
  @Type(() => Number)
  duration_minutes: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  negative_marking?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  negative_marks_per_question?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  randomize_questions?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  randomize_options?: boolean;
}

export class SmartTestSyllabusWeightageDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  syllabus_node_id: number;

  @ApiProperty({ example: 10, description: 'Number of questions drawn from this section' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  questions: number;
}

export class CreateAspirantSmartTestDto {
  @ApiProperty({ example: 'UPSC GS Smart Test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  paper_template_id: number;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  syllabus_node_ids?: number[];

  @ApiProperty({
    required: false,
    type: [SmartTestSyllabusWeightageDto],
    description:
      'Optional per-section question weightage. When omitted, questions are drawn freely from all selected sections.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SmartTestSyllabusWeightageDto)
  syllabus_weightage?: SmartTestSyllabusWeightageDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  randomize_questions?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  randomize_options?: boolean;
}
