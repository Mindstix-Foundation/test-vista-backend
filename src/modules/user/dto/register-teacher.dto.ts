import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  Length,
  MinLength,
  Matches,
  IsInt,
  ValidateIf,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TeacherCurriculumScopeItemDto {
  @ApiProperty({ example: 1, description: 'Standard id (must belong to board_id)' })
  @Type(() => Number)
  @IsInt()
  standard_id: number;

  @ApiProperty({ type: [Number], example: [1, 2], description: 'Subject ids for this standard' })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  subject_ids: number[];
}

export class UpdateTeacherCurriculumScopeDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  board_id: number;

  @ApiProperty({ type: [TeacherCurriculumScopeItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TeacherCurriculumScopeItemDto)
  scopes: TeacherCurriculumScopeItemDto[];
}

/**
 * Public teacher self-registration (P2).
 * Requires curriculum scope (board + standards + subjects) for create-paper.
 * Optional org join request at register time (for assign later).
 */
export class RegisterTeacherDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'priya.teacher@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email_id: string;

  @ApiProperty({ example: 'Password1!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Contact number must be a 10-digit number' })
  contact_number: string;

  @ApiPropertyOptional({ example: 'M.Sc. Mathematics' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  highest_qualification?: string;

  @ApiProperty({ example: 1, description: 'Board for curriculum scope (create papers)' })
  @Type(() => Number)
  @IsInt()
  board_id: number;

  @ApiProperty({
    type: [TeacherCurriculumScopeItemDto],
    description: 'At least one standard with one or more subjects',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TeacherCurriculumScopeItemDto)
  scopes: TeacherCurriculumScopeItemDto[];

  @ApiPropertyOptional({ description: 'Public org id to request join' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  institution_id?: number;

  @ApiPropertyOptional({ example: 'TV-S-XXXX-XXXX', description: 'Private/public org code' })
  @IsOptional()
  @IsString()
  org_code?: string;

  @ApiPropertyOptional({ example: 'Looking forward to joining' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  request_message?: string;
}

/**
 * Public school-student self-registration with email/password.
 * Without org: lands on Open Learning bridge until they join a school later.
 * With org: creates pending Learner_Institution_Membership for that school_standard.
 */
export class RegisterStudentDto {
  @ApiProperty({ example: 'Aarav Patel' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'aarav.student@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email_id: string;

  @ApiProperty({ example: 'Password1!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Contact number must be a 10-digit number' })
  contact_number: string;

  @ApiProperty({ example: 'STU001', description: 'Roll / student ID' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  student_id: string;

  @ApiPropertyOptional({ description: 'School institution id to request join' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  institution_id?: number;

  @ApiPropertyOptional({ example: 'TV-S-XXXX-XXXX' })
  @IsOptional()
  @IsString()
  org_code?: string;

  @ApiPropertyOptional({
    description: 'Required when joining an organization',
    example: 1,
  })
  @ValidateIf((o) => !!(o.institution_id || o.org_code))
  @Type(() => Number)
  @IsInt()
  school_standard_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  request_message?: string;
}
