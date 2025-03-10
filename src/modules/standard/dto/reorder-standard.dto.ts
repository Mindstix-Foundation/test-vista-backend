import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class ReorderStandardDto {
  @ApiProperty({
    description: 'New sequence number for the standard',
    example: 2
  })
  @IsInt()
  @IsNotEmpty()
  newPosition: number;

  @ApiProperty({
    description: 'Board ID (optional, for verification)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  boardId?: number;
} 