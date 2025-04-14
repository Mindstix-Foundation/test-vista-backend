import { ApiProperty } from '@nestjs/swagger';

export class ChapterMarksRangeFilterDto {
  @ApiProperty({
    description: 'ID of the pattern to use for mark calculation',
    example: 1,
    required: true
  })
  patternId: number;

  @ApiProperty({
    description: 'Array of chapter IDs to get mark ranges for',
    example: [1, 2, 3],
    required: true,
    type: [Number]
  })
  chapterIds: number[];

  @ApiProperty({
    description: 'Array of medium IDs to filter questions by',
    example: [1, 2],
    required: true,
    type: [Number]
  })
  mediumIds: number[];
}

export class ChapterMarksRangeResponseDto {
  @ApiProperty({
    description: 'ID of the chapter',
    example: 1
  })
  chapterId: number;

  @ApiProperty({
    description: 'Name of the chapter',
    example: 'Chapter 1'
  })
  chapterName: string;

  @ApiProperty({
    description: 'Array of all possible mark values that can be achieved',
    example: [2, 4, 5, 7, 9, 11, 12, 14],
    type: [Number]
  })
  possibleMarks: number[];

  @ApiProperty({
    description: 'Minimum possible marks for the chapter',
    example: 2
  })
  minMarks: number;

  @ApiProperty({
    description: 'Maximum possible marks for the chapter',
    example: 14
  })
  maxMarks: number;
} 