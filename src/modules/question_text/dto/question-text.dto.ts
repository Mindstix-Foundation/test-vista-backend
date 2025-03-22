import { IsString, IsInt, IsOptional, IsNotEmpty, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto, SortField, SortOrder } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

// Add a new DTO for verification
export class VerifyQuestionTextDto {
  @ApiProperty({
    example: true,
    description: 'Set verification status',
    required: true
  })
  @IsBoolean()
  @IsNotEmpty()
  is_verified: boolean;
}

// Add a DTO for batch verification
export class BatchVerifyQuestionTextDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'IDs of question texts to verify',
    required: true,
    type: [Number]
  })
  @IsInt({ each: true })
  @IsNotEmpty()
  @Type(() => Number)
  ids: number[];

  @ApiProperty({
    example: true,
    description: 'Set verification status',
    required: true
  })
  @IsBoolean()
  @IsNotEmpty()
  is_verified: boolean;
}

// DTO for creating MCQ options
export class CreateMcqOptionDto {
  @ApiProperty({
    description: 'Option text',
    example: 'This is an MCQ option'
  })
  @IsString()
  @IsNotEmpty()
  option_text: string;

  @ApiProperty({
    description: 'Whether this option is correct',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  is_correct?: boolean = false;
}

// DTO for creating match pairs
export class CreateMatchPairDto {
  @ApiProperty({
    description: 'Left side text of the match pair',
    example: 'Left side text'
  })
  @IsString()
  @IsNotEmpty()
  left_text: string;

  @ApiProperty({
    description: 'Right side text of the match pair',
    example: 'Right side text'
  })
  @IsString()
  @IsNotEmpty()
  right_text: string;
}

export class CreateQuestionTextDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the question'
  })
  @IsInt()
  @IsNotEmpty()
  question_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the instruction medium'
  })
  @IsInt()
  @IsOptional()
  instruction_medium_id?: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the image (optional)',
    required: false
  })
  @IsInt()
  @IsOptional()
  image_id?: number;

  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'The question text'
  })
  @IsString()
  @IsNotEmpty()
  question_text: string;
  
  @ApiProperty({
    example: false,
    description: 'Whether this question text is verified',
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @IsInt()
  @IsOptional()
  topic_id?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMcqOptionDto)
  mcq_options?: CreateMcqOptionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMatchPairDto)
  match_pairs?: CreateMatchPairDto[];
}

export class UpdateQuestionTextDto {
  @ApiProperty({
    description: 'Updated question text content',
    example: 'What is the capital of France?',
    required: false
  })
  @IsString()
  @IsOptional()
  question_text?: string;

  @ApiProperty({
    description: 'ID of the image to associate with the question text',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  image_id?: number;

  @ApiProperty({
    description: 'ID of the instruction medium',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  instruction_medium_id?: number;

  @ApiProperty({
    description: 'ID of the topic to associate with this question text',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  topic_id?: number;

  @ApiProperty({
    description: 'Whether the question text is verified',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @ApiProperty({
    description: 'Array of MCQ options for this question text',
    type: [CreateMcqOptionDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMcqOptionDto)
  mcq_options?: CreateMcqOptionDto[];

  @ApiProperty({
    description: 'Array of match pairs for this question text',
    type: [CreateMatchPairDto],
    required: false
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMatchPairDto)
  match_pairs?: CreateMatchPairDto[];
}

export class QuestionTextFilterDto extends PaginationDto {
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

// Update the enum for question text-specific sort fields
export enum QuestionTextSortField {
  QUESTION_ID = 'question_id',
  QUESTION_TEXT = 'question_text',
  // Include the standard sort fields
  CREATED_AT = SortField.CREATED_AT,
  UPDATED_AT = SortField.UPDATED_AT
} 