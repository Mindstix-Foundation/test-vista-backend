import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsBoolean, IsEnum, IsEmail, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum InstitutionTypeDto {
  SCHOOL = 'SCHOOL',
  COACHING_CENTER = 'COACHING_CENTER',
  VIRTUAL = 'VIRTUAL',
}

export enum InstitutionVisibilityDto {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class CreateInstitutionDto {
  @ApiProperty({ enum: InstitutionTypeDto, example: 'COACHING_CENTER' })
  @IsEnum(InstitutionTypeDto)
  institution_type: InstitutionTypeDto;

  @ApiProperty({ example: 'Chanakya IAS Academy - Pune' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  principal_name?: string;

  @ApiProperty({ required: false, enum: InstitutionVisibilityDto, default: 'PRIVATE' })
  @IsOptional()
  @IsEnum(InstitutionVisibilityDto)
  visibility?: InstitutionVisibilityDto;

  @ApiProperty({ required: false, type: [Number], description: 'Exam program IDs offered' })
  @IsOptional()
  exam_program_ids?: number[];
}

export class UpdateInstitutionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  principal_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false, enum: InstitutionVisibilityDto })
  @IsOptional()
  @IsEnum(InstitutionVisibilityDto)
  visibility?: InstitutionVisibilityDto;
}

/** Org-admin teacher: set PUBLIC (browseable) or PRIVATE (org-code only). */
export class UpdateOrgVisibilityDto {
  @ApiProperty({ enum: InstitutionVisibilityDto, example: 'PUBLIC' })
  @IsEnum(InstitutionVisibilityDto)
  visibility: InstitutionVisibilityDto;
}

export class CreateCohortDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  exam_program_id: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  institution_id?: number;

  @ApiProperty({ example: 'UPSC 2026 Batch A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: '2026-27' })
  @IsOptional()
  @IsString()
  academic_year?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class MapTeacherCohortDto {
  @ApiProperty({ example: 1, description: 'Teacher user id (defaults to self if omitted for TEACHER self-claim)' })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  exam_cohort_id: number;
}

export class InstitutionFilterDto {
  @ApiProperty({ required: false, enum: InstitutionTypeDto })
  @IsOptional()
  @IsEnum(InstitutionTypeDto)
  institution_type?: InstitutionTypeDto;

  @ApiProperty({ required: false, enum: InstitutionVisibilityDto })
  @IsOptional()
  @IsEnum(InstitutionVisibilityDto)
  visibility?: InstitutionVisibilityDto;

  @ApiProperty({ required: false, description: 'Join/search by org code' })
  @IsOptional()
  @IsString()
  org_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_program_id?: number;
}
