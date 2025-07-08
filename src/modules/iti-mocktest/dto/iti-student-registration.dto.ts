import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ItiStudentRegistrationDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the student' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ROLL001', description: 'Student roll number' })
  @IsString()
  @IsNotEmpty()
  roll_no: string;

  @ApiProperty({ example: 1, description: 'Board ID' })
  @IsNumber()
  @IsNotEmpty()
  board_id: number;

  @ApiProperty({ example: 1, description: 'School/College ID' })
  @IsNumber()
  @IsNotEmpty()
  school_id: number;

  @ApiProperty({ example: 1, description: 'Standard ID' })
  @IsNumber()
  @IsNotEmpty()
  standard_id: number;
}

export class ItiStudentLoginDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the student' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ROLL001', description: 'Student roll number' })
  @IsString()
  @IsNotEmpty()
  roll_no: string;

  @ApiProperty({ example: 1, description: 'Board ID' })
  @IsNumber()
  @IsNotEmpty()
  board_id: number;

  @ApiProperty({ example: 1, description: 'School/College ID' })
  @IsNumber()
  @IsNotEmpty()
  school_id: number;

  @ApiProperty({ example: 1, description: 'Standard ID' })
  @IsNumber()
  @IsNotEmpty()
  standard_id: number;
} 