import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class UserSchoolDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  school_id: number;

  @ApiProperty({ example: '2024-02-05' })
  @IsDateString()
  start_date: Date;

  @ApiPropertyOptional({ example: '2025-02-05' })
  @IsDateString()
  @IsOptional()
  end_date?: Date;
}

export class CreateUserSchoolDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  school_id: number;

  @ApiProperty({ example: '2024-02-05' })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiPropertyOptional({ example: '2025-02-05' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class UpdateUserSchoolDto {
  @ApiPropertyOptional({ example: '2024-02-05' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-02-05' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
} 