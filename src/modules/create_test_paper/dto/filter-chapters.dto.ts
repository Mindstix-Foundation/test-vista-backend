import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FilterChaptersDto {
  @ApiProperty({
    description: 'ID of the pattern to use for mark calculation',
    example: 6
  })
  @IsNotEmpty()
  @IsNumber()
  patternId: number;

  @ApiProperty({
    description: 'Array of chapter IDs to get marks for',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  chapterIds: number[];

  @ApiProperty({
    description: 'Array of medium IDs to filter questions by',
    example: [1, 2],
    type: [Number]
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  mediumIds: number[];
  
  @ApiProperty({ 
    description: 'Filter by question origin: "board" (only board questions), "other" (only non-board questions), or "both" (all questions)',
    enum: ['board', 'other', 'both'],
    default: 'both',
    required: false
  })
  @IsOptional()
  questionOrigin?: 'board' | 'other' | 'both';
} 