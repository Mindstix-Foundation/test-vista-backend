import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InviteRoleDto {
  TEACHER = 'TEACHER',
  LEARNER = 'LEARNER',
}

export class CsvInviteRowDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name: string;

  @ApiProperty({ example: 'priya@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: InviteRoleDto, example: InviteRoleDto.LEARNER })
  @IsEnum(InviteRoleDto)
  role: InviteRoleDto;

  @ApiPropertyOptional({
    description: 'Exam program for LEARNER aspirants (defaults to Civil Services / UPSC CSE when omitted)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  exam_program_id?: number;
}

export class CsvInviteDto {
  @ApiProperty({ type: [CsvInviteRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CsvInviteRowDto)
  rows: CsvInviteRowDto[];
}
