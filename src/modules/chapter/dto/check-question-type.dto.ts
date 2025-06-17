import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckQuestionTypeDto {
  @ApiProperty({ 
    description: 'Array of chapter IDs', 
    required: true, 
    type: [Number],
    example: '1,2,3'
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => {
        const parsed = typeof v === 'string' ? parseInt(v.trim(), 10) : v;
        return isNaN(parsed) ? 0 : parsed;
      });
    }
    if (typeof value === 'string') {
      return value.split(',').map(id => {
        const parsed = parseInt(id.trim(), 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    }
    return [];
  })
  @IsArray()
  @IsNumber({}, { each: true, message: 'Each chapterId must be a number' })
  chapterIds: number[];

  @ApiProperty({ 
    description: 'Pattern ID to get question types from', 
    required: true,
    type: Number,
    example: 1
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const parsed = typeof value === 'string' ? parseInt(value.trim(), 10) : value;
    return isNaN(parsed) ? 0 : parsed;
  })
  @IsNumber({}, { message: 'patternId must be a number' })
  patternId: number;

  @ApiProperty({ 
    description: 'Array of medium IDs. If multiple mediums are provided, only questions available in ALL specified mediums will be counted.', 
    required: true, 
    type: [Number],
    example: '1,2,3'
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => {
        const parsed = typeof v === 'string' ? parseInt(v.trim(), 10) : v;
        return isNaN(parsed) ? 0 : parsed;
      });
    }
    if (typeof value === 'string') {
      return value.split(',').map(id => {
        const parsed = parseInt(id.trim(), 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    }
    return [];
  })
  @IsArray()
  @IsNumber({}, { each: true, message: 'Each mediumId must be a number' })
  mediumIds: number[];
} 