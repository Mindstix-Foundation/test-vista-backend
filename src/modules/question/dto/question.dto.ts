import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto, SortField, SortOrder } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

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
  
  @ApiProperty({
    example: false,
    description: 'Whether this question is verified'
  })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
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
  
  @ApiProperty({
    example: true,
    description: 'Whether this question is verified'
  })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
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
    example: 1,
    description: 'Filter by instruction medium ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'instruction_medium_id must be an integer' })
  instruction_medium_id?: number;
}

// Update the enum for question-specific sort fields
export enum QuestionSortField {
  QUESTION_TYPE = 'question_type_id',
  IS_VERIFIED = 'is_verified',
  BOARD_QUESTION = 'board_question',
  QUESTION_TEXT = 'question_text',
  CREATED_AT = SortField.CREATED_AT,
  UPDATED_AT = SortField.UPDATED_AT
} 