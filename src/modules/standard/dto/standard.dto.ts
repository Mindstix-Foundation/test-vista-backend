import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class StandardDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Class 10' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  board_id: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CreateStandardDto {
  @ApiProperty({ example: 'Class 10', description: 'Name of the standard' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({ example: 1, description: 'ID of the board' })
  @IsNumber({}, { message: 'Board ID must be a number' })
  @IsNotEmpty({ message: 'Board ID is required' })
  board_id: number;
}

export class UpdateStandardDto {
  @ApiPropertyOptional({ example: 'Class 11', description: 'Name of the standard' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty if provided' })
  name?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of the board' })
  @IsOptional()
  @IsNumber({}, { message: 'Board ID must be a number' })
  @IsNotEmpty({ message: 'Board ID cannot be empty if provided' })
  board_id?: number;
} 