import { IsInt, IsNotEmpty, IsString } from 'class-validator';
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
    description: 'Name of the chapter',
    example: 'Introduction to Algebra'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
} 