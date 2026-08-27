import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DeliveryModeDto {
  OFFLINE_PDF = 'OFFLINE_PDF',
  ONLINE_MCQ = 'ONLINE_MCQ',
  ONLINE_MIXED = 'ONLINE_MIXED',
}

export enum AnswerFormatDto {
  MCQ = 'MCQ',
  NUMERIC = 'NUMERIC',
  TEXT = 'TEXT',
  MATCH_PAIR = 'MATCH_PAIR',
}

export class CreateTemplateSectionDto {
  @ApiProperty({ example: 'General Studies' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  sequence_number: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  total_questions: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  mandatory_questions: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  marks_per_question: number;

  @ApiProperty({ required: false, description: 'Per-section timer in minutes (Banking style)' })
  @IsOptional()
  @IsNumber()
  time_limit_minutes?: number;

  @ApiProperty({ required: false, description: 'Sectional cutoff marks' })
  @IsOptional()
  @IsNumber()
  qualifying_marks?: number;

  @ApiProperty({ required: false, description: 'Overrides template negative marking for this section' })
  @IsOptional()
  @IsNumber()
  negative_marks_per_question?: number;

  @ApiProperty({ enum: AnswerFormatDto, required: false, default: AnswerFormatDto.MCQ })
  @IsOptional()
  @IsEnum(AnswerFormatDto)
  answer_format?: AnswerFormatDto;

  @ApiProperty({ required: false, description: 'Scope section to a syllabus subtree' })
  @IsOptional()
  @IsNumber()
  syllabus_node_id?: number;

  @ApiProperty({ required: false, type: [Number], description: 'Allowed question type IDs' })
  @IsOptional()
  @IsArray()
  question_type_ids?: number[];
}

export class CreatePaperTemplateDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  exam_program_id: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  exam_stage_id?: number;

  @ApiProperty({ example: 'UPSC Prelims GS Paper I - Standard Mock' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(1)
  total_marks: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  total_questions?: number;

  @ApiProperty({ required: false, example: 120 })
  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @ApiProperty({ enum: DeliveryModeDto, required: false, default: DeliveryModeDto.ONLINE_MCQ })
  @IsOptional()
  @IsEnum(DeliveryModeDto)
  delivery_mode?: DeliveryModeDto;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  negative_marking?: boolean;

  @ApiProperty({ required: false, example: 0.33 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  negative_marks_ratio?: number;

  @ApiProperty({ required: false, example: 0.01, description: 'Tolerance for NAT numeric answers' })
  @IsOptional()
  @IsNumber()
  nat_tolerance?: number;

  @ApiProperty({ type: [CreateTemplateSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateSectionDto)
  sections: CreateTemplateSectionDto[];
}

export class UpdatePaperTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total_marks?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total_questions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @ApiProperty({ enum: DeliveryModeDto, required: false })
  @IsOptional()
  @IsEnum(DeliveryModeDto)
  delivery_mode?: DeliveryModeDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  negative_marking?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  negative_marks_ratio?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ type: [CreateTemplateSectionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateSectionDto)
  sections?: CreateTemplateSectionDto[];
}

export class CreateMockTestDto {
  @ApiProperty({ example: 1, description: 'Paper template to instantiate' })
  @IsNumber()
  paper_template_id: number;

  @ApiProperty({ example: 'UPSC Prelims GS Mock #1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    type: [Number],
    description: 'Syllabus node IDs to draw questions from (subtrees included). Empty = whole program syllabus.',
  })
  @IsOptional()
  @IsArray()
  syllabus_node_ids?: number[];

  @ApiProperty({ required: false, description: 'Exam instructions shown to candidates' })
  @IsOptional()
  @IsString()
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

export class PaperTemplateFilterDto {
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

  @ApiProperty({ required: false, enum: DeliveryModeDto })
  @IsOptional()
  @IsEnum(DeliveryModeDto)
  delivery_mode?: DeliveryModeDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total_marks?: number;

  @ApiProperty({ required: false, description: 'Filter by exam category code' })
  @IsOptional()
  @IsString()
  category?: string;
}
