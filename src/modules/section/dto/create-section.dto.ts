import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({
    description: 'Pattern ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  pattern_id: number;

  @ApiProperty({
    description: 'Section sequence number',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sequence_number: number;

  @ApiProperty({
    description: 'Section number',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  section_number: number;

  @ApiProperty({
    description: 'Sub section',
    example: 'A',
    required: false
  })
  @IsString()
  @IsOptional()
  sub_section?: string;

  @ApiProperty({
    description: 'Section name',
    example: 'Multiple Choice Questions'
  })
  @IsString()
  @IsNotEmpty()
  section_name: string;

  @ApiProperty({
    description: 'Total questions',
    example: 10
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  total_questions: number;

  @ApiProperty({
    description: 'Mandatory questions',
    example: 8
  })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  mandotory_questions: number;

  @ApiProperty({
    description: 'Marks per question',
    example: 2
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  marks_per_question: number;
} 