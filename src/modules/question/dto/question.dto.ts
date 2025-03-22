import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsEnum, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto, SortField, SortOrder } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

// Update the enum for question-specific sort fields
export enum QuestionSortField {
  QUESTION_TYPE = 'question_type_id',
  BOARD_QUESTION = 'board_question',
  CREATED_AT = SortField.CREATED_AT,
  UPDATED_AT = SortField.UPDATED_AT
}

export class CreateQuestionDto {
  @ApiProperty({
    example: 1,
    description: 'Question type ID'
  })
  @IsInt()
  @IsNotEmpty()
  question_type_id: number;

  @ApiProperty({
    example: true,
    description: 'Whether this is a board question'
  })
  @IsBoolean()
  @IsNotEmpty()
  board_question: boolean;
}

export class UpdateQuestionDto {
  @ApiProperty({
    example: 1,
    description: 'Question type ID'
  })
  @IsInt()
  @IsOptional()
  question_type_id?: number;

  @ApiProperty({
    example: true,
    description: 'Whether this is a board question'
  })
  @IsBoolean()
  @IsOptional()
  board_question?: boolean;
}

export class QuestionFilterDto extends PaginationDto {
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by question type ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'question_type_id must be an integer' })
  question_type_id?: number;
  
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by topic ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'topic_id must be an integer' })
  topic_id?: number;
  
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by chapter ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'chapter_id must be an integer' })
  chapter_id?: number;
  
  @ApiProperty({
    required: false,
    example: true,
    description: 'Filter by board question flag'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'board_question must be a boolean' })
  board_question?: boolean;
  
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by instruction medium ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'instruction_medium_id must be an integer' })
  instruction_medium_id?: number;
}

export class CreateMcqOptionDto {
  @ApiProperty({
    example: 'Paris',
    description: 'The text of the option'
  })
  @IsNotEmpty()
  option_text: string;

  @ApiProperty({
    example: 1,
    description: 'Image ID for the option (optional)',
    required: false
  })
  @IsOptional()
  @IsInt()
  image_id?: number;

  @ApiProperty({
    example: true,
    description: 'Whether this option is correct'
  })
  @IsBoolean()
  @IsOptional()
  is_correct?: boolean;
}

export class CreateMatchPairDto {
  @ApiProperty({
    example: 'Left side text',
    description: 'Text for the left side of the match pair (optional)',
    required: false
  })
  @IsOptional()
  left_text?: string;

  @ApiProperty({
    example: 'Right side text',
    description: 'Text for the right side of the match pair (optional)',
    required: false
  })
  @IsOptional()
  right_text?: string;

  @ApiProperty({
    example: 1,
    description: 'Left image ID (optional)',
    required: false
  })
  @IsOptional()
  @IsInt()
  left_image_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Right image ID (optional)',
    required: false
  })
  @IsOptional()
  @IsInt()
  right_image_id?: number;
}

export class CreateQuestionTextData {
  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'The text of the question'
  })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({
    example: 1,
    description: 'Image ID for the question (optional)',
    required: false
  })
  @IsOptional()
  @IsInt()
  image_id?: number;

  @ApiProperty({
    type: [CreateMcqOptionDto],
    description: 'MCQ options (for MCQ question types)',
    required: false
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMcqOptionDto)
  mcq_options?: CreateMcqOptionDto[];

  @ApiProperty({
    type: [CreateMatchPairDto],
    description: 'Match pairs (for matching question types)',
    required: false
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMatchPairDto)
  match_pairs?: CreateMatchPairDto[];
}

export class CreateQuestionTopicData {
  @ApiProperty({
    example: 1,
    description: 'Topic ID'
  })
  @IsInt()
  @IsNotEmpty()
  topic_id: number;
}

export class CreateQuestionTextTopicMediumData {
  @ApiProperty({
    example: 1,
    description: 'Instruction medium ID'
  })
  @IsInt()
  @IsNotEmpty()
  instruction_medium_id: number;
}

export class CompleteQuestionDto {
  // Question properties
  @ApiProperty({
    example: 1,
    description: 'Question type ID'
  })
  @IsInt()
  @IsNotEmpty()
  question_type_id: number;

  @ApiProperty({
    example: true,
    description: 'Whether this is a board question'
  })
  @IsBoolean()
  @IsNotEmpty()
  board_question: boolean;

  // Question text data
  @ApiProperty({
    type: CreateQuestionTextData,
    description: 'Question text details'
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateQuestionTextData)
  question_text_data: CreateQuestionTextData;

  // Question topic data
  @ApiProperty({
    type: CreateQuestionTopicData,
    description: 'Question topic association'
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateQuestionTopicData)
  question_topic_data: CreateQuestionTopicData;

  // Question text topic medium data
  @ApiProperty({
    type: CreateQuestionTextTopicMediumData,
    description: 'Question text topic medium association',
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateQuestionTextTopicMediumData)
  question_text_topic_medium_data?: CreateQuestionTextTopicMediumData;
}

export class CreateQuestionTextTopicMediumDto {
  @ApiProperty({
    example: 1,
    description: 'Question topic ID'
  })
  @IsInt()
  @IsNotEmpty()
  question_topic_id: number;

  @ApiProperty({
    example: 1,
    description: 'Instruction medium ID'
  })
  @IsInt()
  @IsNotEmpty()
  instruction_medium_id: number;
}

export class CreateQuestionTopicDto {
  @ApiProperty({
    example: 1,
    description: 'Topic ID'
  })
  @IsInt()
  @IsNotEmpty()
  topic_id: number;
}

export class ComplexCreateQuestionDto {
  // Question properties
  @ApiProperty({
    example: 1,
    description: 'Question type ID'
  })
  @IsInt()
  @IsNotEmpty()
  question_type_id: number;

  @ApiProperty({
    example: true,
    description: 'Whether this is a board question'
  })
  @IsBoolean()
  @IsNotEmpty()
  board_question: boolean;

  // Question text properties
  @ApiProperty({
    type: CreateQuestionTextData,
    description: 'Question text details'
  })
  @IsNotEmpty()
  question_text_data: CreateQuestionTextData;

  // Question topic association
  @ApiProperty({
    type: CreateQuestionTopicData,
    description: 'Question topic association'
  })
  @IsNotEmpty()
  question_topic_data: CreateQuestionTopicData;

  // Question text topic medium association (optional)
  @ApiProperty({
    type: CreateQuestionTextTopicMediumData,
    description: 'Question text topic medium association',
    required: false
  })
  @IsOptional()
  question_text_topic_medium_data?: CreateQuestionTextTopicMediumData;
} 