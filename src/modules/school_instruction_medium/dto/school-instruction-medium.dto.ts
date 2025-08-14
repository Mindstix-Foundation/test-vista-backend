import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class SchoolInstructionMediumDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  instruction_medium_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  school_id: number;
}

export class CreateSchoolInstructionMediumDto {
  @ApiProperty({ example: 1, description: 'ID of the instruction medium' })
  @IsNumber()
  @IsNotEmpty()
  instruction_medium_id: number;

  @ApiProperty({ example: 1, description: 'ID of the school' })
  @IsNumber()
  @IsNotEmpty()
  school_id: number;
} 