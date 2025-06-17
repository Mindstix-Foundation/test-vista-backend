import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsOptional, IsNumber } from 'class-validator';
import { UpdateAddressDto } from '../../address/dto/address.dto';
import { UpdateBoardDto } from '../../board/dto/board.dto';
import { UpdateInstructionMediumDto } from '../../instruction_medium/dto/instruction-medium.dto';
import { UpdateStandardDto } from '../../standard/dto/standard.dto';
import { UpdateSubjectDto } from '../../subject/dto/subject.dto';

// Enhanced DTOs with ID support for updates
export class UpdateInstructionMediumWithIdDto extends UpdateInstructionMediumDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;
}

export class UpdateStandardWithIdDto extends UpdateStandardDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sequence_number?: number;
}

export class UpdateSubjectWithIdDto extends UpdateSubjectDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;
}

export class UpdateBoardManagementDto {
  @ApiProperty({ type: UpdateBoardDto })
  @ValidateNested()
  @Type(() => UpdateBoardDto)
  @IsOptional()
  board?: UpdateBoardDto;

  @ApiProperty({ type: UpdateAddressDto })
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;

  @ApiProperty({ type: [UpdateInstructionMediumWithIdDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInstructionMediumWithIdDto)
  @IsOptional()
  instructionMediums?: UpdateInstructionMediumWithIdDto[];

  @ApiProperty({ type: [UpdateStandardWithIdDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStandardWithIdDto)
  @IsOptional()
  standards?: UpdateStandardWithIdDto[];

  @ApiProperty({ type: [UpdateSubjectWithIdDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubjectWithIdDto)
  @IsOptional()
  subjects?: UpdateSubjectWithIdDto[];

  // Arrays for entities to delete
  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  deleteInstructionMediumIds?: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  deleteStandardIds?: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  deleteSubjectIds?: number[];
} 