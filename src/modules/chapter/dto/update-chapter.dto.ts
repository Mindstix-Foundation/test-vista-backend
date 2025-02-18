import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateChapterDto {
  @ApiPropertyOptional({ description: 'Medium Standard Subject ID', example: 1 })
  @IsInt()
  @IsOptional()
  medium_standard_subject_id?: number;

  @ApiPropertyOptional({ description: 'Sequential number of the chapter', example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  sequential_chapter_number?: number;

  @ApiPropertyOptional({ description: 'Name of the chapter', example: 'Introduction to Algebra' })
  @IsString()
  @IsOptional()
  name?: string;
} 