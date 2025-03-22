import { IsInt, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateQuestionTextTopicMediumDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the question text'
  })
  @IsInt()
  @IsNotEmpty()
  question_text_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the question topic'
  })
  @IsInt()
  @IsNotEmpty()
  question_topic_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the instruction medium'
  })
  @IsInt()
  @IsNotEmpty()
  instruction_medium_id: number;

  @ApiProperty({
    example: false,
    description: 'Whether the association is verified',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}

export class UpdateQuestionTextTopicMediumDto {
  @ApiProperty({
    example: false,
    description: 'Whether the association is verified'
  })
  @IsBoolean()
  is_verified: boolean;
}

export class QuestionTextTopicMediumFilterDto {
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by question text ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'question_text_id must be an integer' })
  question_text_id?: number;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by question topic ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'question_topic_id must be an integer' })
  question_topic_id?: number;

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
  @Type(() => Boolean)
  @IsBoolean({ message: 'is_verified must be a boolean' })
  is_verified?: boolean;
} 