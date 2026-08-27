import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsEnum, IsEmail, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum ParticipantTypeDto {
  SCHOOL_STUDENT = 'SCHOOL_STUDENT',
  INSTITUTE_STUDENT = 'INSTITUTE_STUDENT',
  ASPIRANT = 'ASPIRANT',
}

export class RegisterAspirantDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rahul.sharma@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  contact_number: string;

  @ApiProperty({ example: 1, description: 'Exam program to enroll in (e.g. UPSC CSE)' })
  @IsNumber()
  exam_program_id: number;

  @ApiProperty({ required: false, description: 'Coaching center / institution ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  institution_id?: number;

  @ApiProperty({ required: false, example: 'TV-C-XXXX-XXXX' })
  @IsOptional()
  @IsString()
  org_code?: string;

  @ApiProperty({
    required: false,
    description: 'Required when requesting to join a coaching org at register',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  school_standard_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  request_message?: string;

  @ApiProperty({ required: false, description: 'Cohort / batch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_cohort_id?: number;
}

export class EnrollProgramDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  participant_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  exam_program_id: number;
}

export class ParticipantFilterDto {
  @ApiProperty({ required: false, enum: ParticipantTypeDto })
  @IsOptional()
  @IsEnum(ParticipantTypeDto)
  participant_type?: ParticipantTypeDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  institution_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_cohort_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exam_program_id?: number;
}
