import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateSubsectionQuestionTypeDto {
  @ApiProperty({
    description: 'Section ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  section_id: number;

  @ApiProperty({
    description: 'Sequential subquestion number',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  seqencial_subquestion_number: number;

  @ApiProperty({
    description: 'Question Type ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  question_type_id: number;
} 