import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class InstructionMediumDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'English' })
  @IsString()
  instruction_medium: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  board_id: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CreateInstructionMediumDto {
  @ApiProperty({ example: 'English', description: 'Name of the instruction medium' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({ example: 1, description: 'ID of the board' })
  @IsNumber({}, { message: 'Board ID must be a number' })
  @IsNotEmpty({ message: 'Board ID is required' })
  board_id: number;
}

export class UpdateInstructionMediumDto {
  @ApiPropertyOptional({ example: 'Hindi', description: 'Name of the instruction medium' })
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