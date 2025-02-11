import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { CreateAddressDto } from '../../address/dto/address.dto';
import { CreateBoardDto } from '../../board/dto/board.dto';
import { CreateInstructionMediumDto } from '../../instruction_medium/dto/instruction-medium.dto';
import { CreateStandardDto } from '../../standard/dto/standard.dto';
import { CreateSubjectDto } from '../../subject/dto/subject.dto';

export class CreateBoardManagementDto {
  @ApiProperty({ type: CreateBoardDto })
  @ValidateNested()
  @Type(() => CreateBoardDto)
  board: CreateBoardDto;

  @ApiProperty({ type: CreateAddressDto })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiProperty({ type: [CreateInstructionMediumDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstructionMediumDto)
  instructionMediums: CreateInstructionMediumDto[];

  @ApiProperty({ type: [CreateStandardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStandardDto)
  standards: CreateStandardDto[];

  @ApiProperty({ type: [CreateSubjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  subjects: CreateSubjectDto[];
} 