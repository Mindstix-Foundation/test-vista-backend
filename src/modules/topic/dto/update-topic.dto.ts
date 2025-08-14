import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTopicDto {
  @ApiPropertyOptional({ description: 'Chapter ID', example: 1 })
  @IsInt()
  @IsOptional()
  chapter_id?: number;

  @ApiPropertyOptional({ description: 'Sequential number of the topic', example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  sequential_topic_number?: number;

  @ApiPropertyOptional({ description: 'Name of the topic', example: 'Linear Equations' })
  @IsString()
  @IsOptional()
  name?: string;
} 