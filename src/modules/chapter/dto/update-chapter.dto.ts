import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateChapterDto {
  @ApiPropertyOptional({ description: 'Subject ID', example: 1 })
  @IsInt()
  @IsOptional()
  subject_id?: number;

  @ApiPropertyOptional({ description: 'Standard ID', example: 1 })
  @IsInt()
  @IsOptional()
  standard_id?: number;

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