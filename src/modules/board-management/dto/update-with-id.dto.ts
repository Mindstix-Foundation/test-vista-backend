import { UpdateInstructionMediumDto } from '../../instruction_medium/dto/instruction-medium.dto';
import { UpdateStandardDto } from '../../standard/dto/standard.dto';
import { UpdateSubjectDto } from '../../subject/dto/subject.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateInstructionMediumWithIdDto extends UpdateInstructionMediumDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number;
}

export class UpdateStandardWithIdDto extends UpdateStandardDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number;
}

export class UpdateSubjectWithIdDto extends UpdateSubjectDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number;
} 