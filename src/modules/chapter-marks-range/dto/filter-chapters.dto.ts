import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
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
} 