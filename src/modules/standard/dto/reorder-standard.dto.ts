import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class ReorderStandardDto {
  @ApiProperty({
    description: 'New sequence number for the standard',
    example: 2
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  newPosition: number;

  @ApiProperty({
    description: 'Board ID (required for verification)',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  boardId: number;
} 