import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterMcqOptionDto {
  @ApiProperty({
    description: 'Filter options by question text ID',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  question_text_id?: number;
} 