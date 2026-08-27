import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStudentGroupDto {
  @ApiProperty({ example: 'Group A' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Participant IDs to add on create' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participant_ids?: number[];
}

export class UpdateStudentGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class AddGroupMembersDto {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  participant_ids: number[];
}
