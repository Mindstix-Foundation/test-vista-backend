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

  @ApiProperty({ example: 2 })
  @IsNumber()
  sequence_number: number;

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
  
  @ApiPropertyOptional({ example: 1, description: 'Sequence number (auto-generated if not provided)' })
  @IsOptional()
  @IsNumber({}, { message: 'Sequence number must be a number' })
  sequence_number?: number;
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

  @ApiPropertyOptional({ example: 2, description: 'Sequence number of the standard' })
  @IsOptional()
  @IsNumber({}, { message: 'Sequence number must be a number' })
  sequence_number?: number;
} 