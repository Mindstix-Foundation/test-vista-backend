import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionTopicDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the question'
  })
  @IsInt()
  @IsNotEmpty()
  question_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the topic'
  })
  @IsInt()
  @IsNotEmpty()
  topic_id: number;
}

export class QuestionTopicFilterDto {
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by question ID'
  })
  @IsInt()
  @IsOptional()
  question_id?: number;

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
    description: 'Filter by question type ID'
  })
  @IsInt()
  @IsOptional()
  question_type_id?: number;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by chapter ID'
  })
  @IsInt()
  @IsOptional()
  chapter_id?: number;
} 