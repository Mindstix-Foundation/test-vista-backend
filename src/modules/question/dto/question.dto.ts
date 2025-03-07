import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

export class QuestionFilterDto {
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by question type ID'
  })
  @IsInt()
  @IsOptional()
  question_type_id?: number;
  
  @ApiProperty({
    required: false,
    example: true,
    description: 'Filter by verification status'
  })
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;
  
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by topic ID'
  })
  @IsInt()
  @IsOptional()
  topic_id?: number;
  
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by chapter ID'
  })
  @IsInt()
  @IsOptional()
  chapter_id?: number;
} 