import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class ReorderSectionDto {
  @ApiProperty({
    description: 'New sequence number for the section',
    example: 2
  })
  @IsInt()
  @IsNotEmpty()
  newPosition: number;

  @ApiProperty({
    description: 'Pattern ID (optional, for verification)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  patternId?: number;
} 