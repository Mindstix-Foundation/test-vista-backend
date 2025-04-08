import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsEnum, IsString, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SortField, SortOrder } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

// Update the enum for question-specific sort fields
export enum QuestionSortField {
  QUESTION_TYPE = 'question_type_id',
  QUESTION_TEXT = 'question_text',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at'
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

// Base filter DTO that doesn't extend PaginationDto to avoid property type conflicts
export class QuestionFilterDto {
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
  
  @ApiProperty({
    required: false,
    example: true,
    description: 'Filter by verification status'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'is_verified must be a boolean' })
  is_verified?: boolean;
  
  @ApiProperty({
    required: false,
    example: 'original',
    enum: ['original', 'translated'],
    description: 'Filter by translation status'
  })
  @IsOptional()
  @IsString()
  translation_status?: string;
  
  // Add pagination fields
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100)
  page_size?: number;
  
  // Custom sort_by field that accepts QuestionSortField
  @ApiProperty({
    required: false,
    enum: QuestionSortField,
    default: QuestionSortField.CREATED_AT,
    description: 'Sort by field: question_type_id, question_text, created_at, updated_at'
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle string values from query parameters
    if (typeof value === 'string') {
      // Check if it's one of our enum values
      if (Object.values(QuestionSortField).includes(value as any)) {
        return value;
      }
      // Map common field names to enum values
      if (value === 'question_type_id') return QuestionSortField.QUESTION_TYPE;
      if (value === 'question_text') return QuestionSortField.QUESTION_TEXT;
      if (value === 'created_at') return QuestionSortField.CREATED_AT;
      if (value === 'updated_at') return QuestionSortField.UPDATED_AT;
    }
    return value;
  })
  sort_by?: QuestionSortField = QuestionSortField.CREATED_AT;
  
  @ApiProperty({ 
    required: false, 
    enum: SortOrder, 
    default: SortOrder.ASC,
    description: 'Sort order: asc or desc'
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be one of: asc, desc' })
  sort_order?: SortOrder = SortOrder.ASC;
  
  @ApiProperty({ required: false, description: 'Search term to filter results' })
  @IsOptional()
  @IsString()
  search?: string;
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

export class UpdateMcqOptionDto extends CreateMcqOptionDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the MCQ option (required for updates, omit for new options)',
    required: false
  })
  @IsOptional()
  @IsInt()
  id?: number;
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

export class UpdateMatchPairDto extends CreateMatchPairDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the match pair (required for updates, omit for new pairs)',
    required: false
  })
  @IsOptional()
  @IsInt()
  id?: number;
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

export class UpdateQuestionTextData {
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
    type: [UpdateMcqOptionDto],
    description: 'MCQ options (for MCQ question types) - include ID for existing options',
    required: false
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateMcqOptionDto)
  mcq_options?: UpdateMcqOptionDto[];

  @ApiProperty({
    type: [UpdateMatchPairDto],
    description: 'Match pairs (for matching question types) - include ID for existing pairs',
    required: false
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateMatchPairDto)
  match_pairs?: UpdateMatchPairDto[];
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
  
  @ApiProperty({
    example: 'original',
    enum: ['original', 'translated'],
    description: 'Translation status (original or translated)',
    default: 'original',
    required: false
  })
  @IsOptional()
  @IsString()
  translation_status?: string;
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
  
  @ApiProperty({
    example: 'original',
    enum: ['original', 'translated'],
    description: 'Translation status (original or translated)',
    default: 'original',
    required: false
  })
  @IsOptional()
  @IsString()
  translation_status?: string;
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

export class EditCompleteQuestionDto {
  // Question properties that can be edited
  @ApiProperty({
    example: true,
    description: 'Whether this is a board question'
  })
  @IsBoolean()
  @IsNotEmpty()
  board_question: boolean;

  // Question text ID to specify which text to update
  @ApiProperty({
    example: 1,
    description: 'ID of the specific question text to update'
  })
  @IsInt()
  @IsNotEmpty()
  question_text_id: number;

  // Question text data that can be edited
  @ApiProperty({
    type: UpdateQuestionTextData,
    description: 'Question text details to update'
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateQuestionTextData)
  question_text_data: UpdateQuestionTextData;

  // Question topic data that can be edited
  @ApiProperty({
    type: CreateQuestionTopicData,
    description: 'Question topic association to update'
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateQuestionTopicData)
  question_topic_data: CreateQuestionTopicData;
}

export class RemoveQuestionFromChapterDto {
  @ApiProperty({
    example: 1,
    description: 'Topic ID to remove the question from'
  })
  @IsInt()
  @IsNotEmpty()
  topic_id: number;

  @ApiProperty({
    example: 1,
    description: 'Instruction medium ID to remove the association with (optional). If not provided, all medium associations for this topic will be removed.',
    required: false
  })
  @IsOptional()
  @IsInt()
  instruction_medium_id?: number;
}

export class AddTranslationDto {
  @ApiProperty({
    example: 'Translated question text',
    description: 'The translated text of the question'
  })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({
    example: 1,
    description: 'Image ID for the question (must be provided if original question has an image, and vice versa)',
    required: false
  })
  @IsOptional()
  @IsInt()
  image_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Instruction medium ID for the translation',
    required: true
  })
  @IsInt()
  @IsNotEmpty()
  instruction_medium_id: number;
  
  // This field is always set to "translated" internally
  @IsOptional()
  translation_status?: string = 'translated';

  @ApiProperty({
    type: [UpdateMcqOptionDto],
    description: 'Translated MCQ options (required if the question type is MCQ)',
    required: false
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateMcqOptionDto)
  mcq_options?: UpdateMcqOptionDto[];

  @ApiProperty({
    type: [UpdateMatchPairDto],
    description: 'Translated match pairs (required if the question type is matching)',
    required: false
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateMatchPairDto)
  match_pairs?: UpdateMatchPairDto[];
}

export class QuestionCountFilterDto {
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
    example: 1,
    description: 'Filter by instruction medium ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'instruction_medium_id must be an integer' })
  instruction_medium_id?: number;
  
  @ApiProperty({
    required: false,
    example: true,
    description: 'Filter by verification status'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'is_verified must be a boolean' })
  is_verified?: boolean;
} 