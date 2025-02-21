import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateQuestionTypeDto {
  @ApiProperty({
    description: 'Name of the question type',
    example: 'Multiple Choice'
  })
  @IsString()
  @IsNotEmpty()
  type_name: string;
} 