import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

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

export class GetMssQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  board_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  instruction_medium_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  standard_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  subject_id?: number;
} 