import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

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

export class UpdateQuestionTopicDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the topic',
    required: false
  })
  @IsInt()
  @IsOptional()
  topic_id?: number;
}

export class QuestionTopicFilterDto extends PaginationDto {
  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by question ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'question_id must be an integer' })
  question_id?: number;
  
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
    description: 'Filter by question type ID'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'question_type_id must be an integer' })
  question_type_id?: number;

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