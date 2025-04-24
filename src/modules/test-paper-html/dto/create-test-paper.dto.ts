import { IsString, IsNumber, IsOptional, IsDate, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTestPaperDto {
  @ApiProperty({
    description: 'Name of the test paper',
    example: 'Mathematics Quarterly Test - Q1 2025',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Exam time in HH:MM:SS format',
    example: '02:00:00', // 2 hours
  })
  @IsDateString()
  exam_time: string;

  @ApiProperty({
    description: 'ID of the pattern to use for this test paper',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  pattern_id: number;

  @ApiProperty({
    description: 'Optional original test paper ID if this is based on another test paper',
    example: 42,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  test_paper_origin_id?: number;
} 