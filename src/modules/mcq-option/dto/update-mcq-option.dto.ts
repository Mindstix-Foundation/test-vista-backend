import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMcqOptionDto {
  @ApiProperty({
    description: 'ID of the question text this option belongs to',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  question_text_id?: number;

  @ApiProperty({
    description: 'Text content of the option',
    example: 'London',
    required: false
  })
  @IsString()
  @IsOptional()
  option_text?: string;

  @ApiProperty({
    description: 'ID of the image associated with this option',
    example: 10,
    required: false
  })
  @IsInt()
  @IsOptional()
  image_id?: number;

  @ApiProperty({
    description: 'Whether this option is the correct answer',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  is_correct?: boolean;
} 