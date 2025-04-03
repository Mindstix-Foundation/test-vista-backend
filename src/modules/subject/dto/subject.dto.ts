import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubjectDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Mathematics' })
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

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics', description: 'Name of the subject' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({ example: 1, description: 'ID of the board' })
  @IsNumber({}, { message: 'Board ID must be a number' })
  @IsNotEmpty({ message: 'Board ID is required' })
  board_id: number;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Advanced Mathematics', description: 'Name of the subject' })
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

export class UnconnectedSubjectsQueryDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID of the board to filter subjects by' 
  })
  @IsNumber({}, { message: 'Board ID must be a number' })
  @IsNotEmpty({ message: 'Board ID is required' })
  @Transform(({ value }) => parseInt(value))
  board_id: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID of the instruction medium' 
  })
  @IsNumber({}, { message: 'Medium ID must be a number' })
  @IsNotEmpty({ message: 'Medium ID is required' })
  @Transform(({ value }) => parseInt(value))
  medium_id: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID of the standard' 
  })
  @IsNumber({}, { message: 'Standard ID must be a number' })
  @IsNotEmpty({ message: 'Standard ID is required' })
  @Transform(({ value }) => parseInt(value))
  standard_id: number;
}

export class SchoolStandardSubjectsQueryDto {
  @ApiProperty({ 
    example: 1, 
    description: 'ID of the school to fetch subjects for' 
  })
  @IsNumber({}, { message: 'School ID must be a number' })
  @IsNotEmpty({ message: 'School ID is required' })
  @Transform(({ value }) => parseInt(value))
  school_id: number;

  @ApiProperty({ 
    example: 1, 
    description: 'ID of the standard to fetch subjects for' 
  })
  @IsNumber({}, { message: 'Standard ID must be a number' })
  @IsNotEmpty({ message: 'Standard ID is required' })
  @Transform(({ value }) => parseInt(value))
  standard_id: number;
} 