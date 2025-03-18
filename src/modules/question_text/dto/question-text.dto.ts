import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto, SortField, SortOrder } from '../../../common/dto/pagination.dto';

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
}

export class UpdateQuestionTextDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the image',
    required: false
  })
  @IsInt()
  @IsOptional()
  image_id?: number;

  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'The question text',
    required: false
  })
  @IsString()
  @IsOptional()
  question_text?: string;
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
}

// Update the enum for question text-specific sort fields
export enum QuestionTextSortField {
  QUESTION_ID = 'question_id',
  QUESTION_TEXT = 'question_text',
  // Include the standard sort fields
  CREATED_AT = SortField.CREATED_AT,
  UPDATED_AT = SortField.UPDATED_AT
} 