import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

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

export class StandardInfoDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;
  
  @ApiProperty({ example: 'First' })
  @IsString()
  name: string;
  
  @ApiProperty({ example: 1 })
  @IsNumber()
  sequence_number: number;
  
  @ApiProperty({ example: 1 })
  @IsNumber()
  board_id: number;
}

export class SchoolStandardSimplifiedDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  school_id: number;

  @ApiProperty()
  standard: StandardInfoDto;
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