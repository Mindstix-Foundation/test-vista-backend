import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

// Simplified DTOs for board-management (without board_id/address_id requirements)
export class BoardManagementAddressDto {
  @ApiProperty({ example: '123 Main Street', description: 'Street address' })
  @IsString({ message: 'Street must be a string' })
  @IsNotEmpty({ message: 'Street cannot be empty' })
  street: string;

  @ApiProperty({ example: '12345', description: 'Postal code' })
  @IsString({ message: 'Postal code must be a string' })
  @IsNotEmpty({ message: 'Postal code cannot be empty' })
  postal_code: string;

  @ApiProperty({ example: 1, description: 'City ID' })
  @IsNumber({}, { message: 'City ID must be a number' })
  @IsNotEmpty({ message: 'City ID is required' })
  city_id: number;
}

export class BoardManagementBoardDto {
  @ApiProperty({ example: 'CBSE', description: 'Board name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({ example: 'CBSE', description: 'Board abbreviation', required: false })
  @IsOptional()
  @IsString({ message: 'Abbreviation must be a string' })
  abbreviation?: string;
}

export class BoardManagementInstructionMediumDto {
  @ApiProperty({ example: 'English', description: 'Instruction medium name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;
}

export class BoardManagementStandardDto {
  @ApiProperty({ example: 'Class 10', description: 'Standard name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;
}

export class BoardManagementSubjectDto {
  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;
}

export class CreateBoardManagementDto {
  @ApiProperty({ type: BoardManagementAddressDto })
  @ValidateNested()
  @Type(() => BoardManagementAddressDto)
  address: BoardManagementAddressDto;

  @ApiProperty({ type: BoardManagementBoardDto })
  @ValidateNested()
  @Type(() => BoardManagementBoardDto)
  board: BoardManagementBoardDto;

  @ApiProperty({ type: [BoardManagementInstructionMediumDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardManagementInstructionMediumDto)
  instructionMediums: BoardManagementInstructionMediumDto[];

  @ApiProperty({ type: [BoardManagementStandardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardManagementStandardDto)
  standards: BoardManagementStandardDto[];

  @ApiProperty({ type: [BoardManagementSubjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardManagementSubjectDto)
  subjects: BoardManagementSubjectDto[];
} 