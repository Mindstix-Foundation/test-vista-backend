import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class MediumStandardSubjectDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  instruction_medium_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  standard_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  subject_id: number;
}

export class CreateMediumStandardSubjectDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  instruction_medium_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  standard_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  subject_id: number;
} 