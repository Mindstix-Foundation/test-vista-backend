import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsNotEmpty, 
  IsEmail, 
  IsBoolean, 
  IsPhoneNumber, 
  Length, 
  IsDate, 
  IsArray, 
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type, Transform, Expose } from 'class-transformer';
import { IsStrongPassword } from '../../../common/validators/password.validator';

/**
 * DTO for standard and subject assignments for updating a teacher
 * Each entry represents one school-standard with multiple subject assignments
 */
export class UpdateStandardSubjectsDto {
  @ApiPropertyOptional({ 
    description: 'ID of the school_standard entry', 
    example: 1 
  })
  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsNumber({}, { message: 'School standard ID must be a number' })
  @IsNotEmpty({ message: 'School standard ID is required' })
  schoolStandardId: number;

  @ApiPropertyOptional({ 
    description: 'Array of subject IDs', 
    type: [Number], 
    example: [1, 2, 3] 
  })
  @Expose()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(item => typeof item === 'string' ? parseInt(item, 10) : item);
    }
    return value;
  })
  @IsArray({ message: 'Subject IDs must be an array' })
  @IsNumber({}, { each: true, message: 'Each subject ID must be a number' })
  @ArrayMinSize(1, { message: 'At least one subject must be specified' })
  subjectIds: number[];
}

/**
 * DTO for updating a teacher with school and subject assignments
 * All fields are optional to allow partial updates
 */
export class UpdateTeacherDto {
  // User details - all optional
  @ApiPropertyOptional({ 
    example: 'John Doe',
    description: 'Full name of the teacher'
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({ 
    example: 'john.doe@example.com',
    description: 'Email address for the teacher'
  })
  @Expose()
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email_id?: string;

  @ApiPropertyOptional({ 
    example: 'Password123!',
    description: 'Password for the teacher'
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword()
  password?: string;

  @ApiPropertyOptional({ 
    example: '+911234567890', 
    description: 'Contact number with country code' 
  })
  @Expose()
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number with country code' })
  contact_number?: string;

  @ApiPropertyOptional({ 
    example: '+919876543210', 
    description: 'Optional alternate contact number' 
  })
  @Expose()
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number with country code' })
  alternate_contact_number?: string;

  @ApiPropertyOptional({ 
    example: 'M.Tech',
    description: 'Highest educational qualification' 
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Qualification must be a string' })
  @Length(2, 50, { message: 'Qualification must be between 2 and 50 characters' })
  highest_qualification?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Account status (active/inactive)'
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Status must be a boolean' })
  status?: boolean;

  // School assignment
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'ID of the school to assign'
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsNumber({}, { message: 'School ID must be a number' })
  school_id?: number;

  @ApiPropertyOptional({ 
    example: '2023-01-01', 
    description: 'Start date at the school' 
  })
  @Expose()
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  start_date?: Date;

  @ApiPropertyOptional({ 
    example: '2024-12-31', 
    description: 'End date at the school' 
  })
  @Expose()
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  end_date?: Date;

  // Standard and subject assignments
  @ApiPropertyOptional({ 
    description: 'Standard and subject assignments', 
    type: [UpdateStandardSubjectsDto],
    example: [
      { schoolStandardId: 1, subjectIds: [1, 2] },
      { schoolStandardId: 2, subjectIds: [3, 4] }
    ]
  })
  @Expose()
  @IsOptional()
  @IsArray({ message: 'Standard-subject assignments must be an array' })
  @Type(() => UpdateStandardSubjectsDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one standard-subject assignment must be specified' })
  standard_subjects?: UpdateStandardSubjectsDto[];
} 