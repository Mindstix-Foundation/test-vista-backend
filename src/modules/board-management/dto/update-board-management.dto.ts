import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { UpdateAddressDto } from '../../address/dto/address.dto';
import { UpdateBoardDto } from '../../board/dto/board.dto';
import { CreateInstructionMediumDto, UpdateInstructionMediumDto } from '../../instruction_medium/dto/instruction-medium.dto';
import { CreateStandardDto, UpdateStandardDto } from '../../standard/dto/standard.dto';
import { CreateSubjectDto, UpdateSubjectDto } from '../../subject/dto/subject.dto';

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

  @ApiProperty({ type: [UpdateInstructionMediumDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInstructionMediumDto)
  @IsOptional()
  instructionMediums?: UpdateInstructionMediumDto[];

  @ApiProperty({ type: [UpdateStandardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateStandardDto)
  @IsOptional()
  standards?: UpdateStandardDto[];

  @ApiProperty({ type: [UpdateSubjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubjectDto)
  @IsOptional()
  subjects?: UpdateSubjectDto[];
} 