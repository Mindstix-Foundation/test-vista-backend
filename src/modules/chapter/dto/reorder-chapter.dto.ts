import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class ReorderChapterDto {
  @ApiProperty({
    description: 'New sequence number for the chapter',
    example: 2
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sequential_chapter_number: number;
} 