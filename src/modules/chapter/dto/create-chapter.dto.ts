import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChapterDto {
  @ApiProperty({
    description: 'Subject ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  subject_id: number;

  @ApiProperty({
    description: 'Standard ID',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  standard_id: number;

  @ApiProperty({
    description: 'Sequential number of the chapter',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sequential_chapter_number: number;

  @ApiProperty({
    description: 'Name of the chapter',
    example: 'Introduction to Algebra'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
} 