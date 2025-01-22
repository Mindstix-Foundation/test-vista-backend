import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class SchoolStandardDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  school_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  standard_id: number;
}

export class CreateSchoolStandardDto {
  @ApiProperty({ example: 1, description: 'ID of the school' })
  @IsNumber()
  @IsNotEmpty({ message: 'School ID is required' })
  school_id: number;

  @ApiProperty({ example: 1, description: 'ID of the standard' })
  @IsNumber()
  @IsNotEmpty({ message: 'Standard ID is required' })
  standard_id: number;
} 