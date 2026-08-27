import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsBoolean,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SyllabusNodeTypeDto {
  SECTION = 'SECTION',
  SUBJECT = 'SUBJECT',
  CHAPTER = 'CHAPTER',
  TOPIC = 'TOPIC',
}

export class CreateSyllabusNodeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  exam_program_id: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  exam_stage_id?: number;

  @ApiProperty({ required: false, description: 'Parent node ID for tree nesting' })
  @IsOptional()
  @IsNumber()
  parent_id?: number;

  @ApiProperty({ enum: SyllabusNodeTypeDto, example: 'SECTION' })
  @IsEnum(SyllabusNodeTypeDto)
  node_type: SyllabusNodeTypeDto;

  @ApiProperty({ example: 'Indian Polity and Governance' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  sequence_number?: number;
}

export class UpdateSyllabusNodeDto {
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
  @IsNumber()
  exam_stage_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parent_id?: number;
}

export class SyllabusFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_program_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_stage_id?: number;

  @ApiProperty({ required: false, enum: SyllabusNodeTypeDto })
  @IsOptional()
  @IsEnum(SyllabusNodeTypeDto)
  node_type?: SyllabusNodeTypeDto;

  @ApiProperty({ required: false, description: 'Filter by parent node; omit for all parents' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_id?: number;
}

export class TagQuestionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  question_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  syllabus_node_id: number;
}

export class BulkTagQuestionsDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  question_ids: number[];

  @ApiProperty({ example: 1 })
  @IsNumber()
  syllabus_node_id: number;
}

export class SyllabusQuestionOptionDto {
  @ApiProperty({ example: 'New Delhi' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_correct: boolean;
}

export class CreateSyllabusQuestionDto {
  @ApiProperty({ example: 1, description: 'Syllabus node to tag the question under' })
  @IsNumber()
  syllabus_node_id: number;

  @ApiProperty({ example: 'MCQ', description: 'MCQ or NUMERIC (NAT)' })
  @IsString()
  question_format: 'MCQ' | 'NUMERIC';

  @ApiProperty({ example: 'Which article of the Constitution deals with the Election Commission?' })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({
    required: false,
    type: [SyllabusQuestionOptionDto],
    description: 'Required for MCQ (exactly one is_correct)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyllabusQuestionOptionDto)
  options?: SyllabusQuestionOptionDto[];

  @ApiProperty({ required: false, example: 324, description: 'Correct value for NUMERIC (NAT) questions' })
  @IsOptional()
  @IsNumber()
  numeric_answer?: number;

  @ApiProperty({ required: false, default: false, description: 'Previous-year question (PYQ) flag' })
  @IsOptional()
  @IsBoolean()
  is_pyq?: boolean;
}

export class CreateSyllabusPassageChildDto {
  @ApiProperty({ example: 'Which of the following conclusions are valid?' })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({ type: [SyllabusQuestionOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => SyllabusQuestionOptionDto)
  options: SyllabusQuestionOptionDto[];

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  group_order?: number;
}

export class CreateSyllabusPassageGroupDto {
  @ApiProperty({ example: 1, description: 'Syllabus node to tag all child questions under' })
  @IsNumber()
  syllabus_node_id: number;

  @ApiProperty({ example: 'Shared passage text…' })
  @IsString()
  @IsNotEmpty()
  passage_text: string;

  @ApiProperty({ required: false, description: 'Idempotent import key' })
  @IsOptional()
  @IsString()
  external_key?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_pyq?: boolean;

  @ApiProperty({ type: [CreateSyllabusPassageChildDto], description: 'At least 2 linked MCQs' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateSyllabusPassageChildDto)
  children: CreateSyllabusPassageChildDto[];
}
