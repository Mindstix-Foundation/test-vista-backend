import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePatternDto {
  @ApiProperty({
    description: 'Name of the pattern',
    example: 'Pattern 2024'
  })
  @IsString()
  @IsNotEmpty()
  pattern_name: string;

  @ApiProperty({
    description: 'Board ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  board_id: number;

  @ApiProperty({
    description: 'Standard ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  standard_id: number;

  @ApiProperty({
    description: 'Subject ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  subject_id: number;

  @ApiProperty({
    description: 'Total marks',
    example: 100
  })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  total_marks: number;
} 