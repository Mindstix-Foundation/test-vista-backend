import { ApiProperty } from '@nestjs/swagger';

export class ChapterMarksResponseDto {
  @ApiProperty({
    description: 'ID of the chapter',
    example: 1
  })
  chapterId: number;

  @ApiProperty({
    description: 'Name of the chapter',
    example: 'Introduction to Algebra'
  })
  chapterName: string;

  @ApiProperty({
    description: 'Maximum possible absolute marks for this chapter based on available questions and pattern',
    example: 20
  })
  absoluteMarks: number;
} 