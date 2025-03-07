import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'ID of the topic'
  })
  @IsInt()
  @IsNotEmpty()
  topic_id: number;

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
    description: 'ID of the topic',
    required: false
  })
  @IsInt()
  @IsOptional()
  topic_id?: number;

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

export class QuestionTextFilterDto {
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by topic ID'
  })
  @IsInt()
  @IsOptional()
  topic_id?: number;
} 