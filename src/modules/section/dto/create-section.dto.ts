import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({
    description: 'Pattern ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  pattern_id: number;

  @ApiProperty({
    description: 'Sequential section number',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  seqencial_section_number: number;

  @ApiProperty({
    description: 'Sub section',
    example: 'A'
  })
  @IsString()
  @IsNotEmpty()
  sub_section: string;

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