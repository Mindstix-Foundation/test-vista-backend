import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetMediumsQueryDto {
  @ApiProperty({
    description: 'Standard ID',
    example: 1,
    required: true
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  standard_id: number;

  @ApiProperty({
    description: 'Subject ID',
    example: 1,
    required: true
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  subject_id: number;

  @ApiProperty({
    description: 'Board ID',
    example: 1,
    required: true
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  board_id: number;
}

export class MediumsResponse {
  @ApiProperty({
    description: 'Whether multiple instruction mediums exist for this standard and subject',
    example: true
  })
  has_multiple_mediums: boolean;

  @ApiProperty({
    description: 'Array of instruction mediums',
    type: [Object]
  })
  mediums: Array<{
    id: number;
    instruction_medium: string;
    medium_standard_subject_id?: number;
  }>;
} 