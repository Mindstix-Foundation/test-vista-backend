import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMcqOptionDto {
  @ApiProperty({
    description: 'ID of the question text this option belongs to',
    example: 1
  })
  @IsInt()
  question_text_id: number;

  @ApiProperty({
    description: 'Text content of the option',
    example: 'Paris',
    required: false
  })
  @IsString()
  @IsOptional()
  option_text?: string;

  @ApiProperty({
    description: 'ID of the image associated with this option (if any)',
    example: 5,
    required: false
  })
  @IsInt()
  @IsOptional()
  image_id?: number;

  @ApiProperty({
    description: 'Whether this option is the correct answer',
    example: true
  })
  @IsBoolean()
  is_correct: boolean;
} 