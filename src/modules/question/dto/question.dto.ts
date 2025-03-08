import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto, SortField, SortOrder } from '../../../common/dto/pagination.dto';

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
    example: true,
    description: 'Filter by verification status'
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'is_verified must be a boolean' })
  is_verified?: boolean;
  
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
}

// Add a new enum for question-specific sort fields
export enum QuestionSortField {
  QUESTION_TYPE = 'question_type_id',
  // Include the standard sort fields
  NAME = SortField.NAME,
  CREATED_AT = SortField.CREATED_AT,
  UPDATED_AT = SortField.UPDATED_AT
} 