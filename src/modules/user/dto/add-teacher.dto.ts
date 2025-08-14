import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
 * DTO for standard and subject assignments for a teacher
 * Each entry represents one school-standard with multiple subject assignments
 */
export class StandardSubjectsDto {
  @ApiProperty({ 
    description: 'ID of the school_standard entry (not the standard ID itself)', 
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

  @ApiProperty({ 
    description: 'Array of subject IDs to assign to the teacher for this standard', 
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
 * DTO for adding a teacher with school and subject assignments
 * 
 * This DTO captures all information needed to:
 * 1. Create a new user with TEACHER role
 * 2. Assign the teacher to a school
 * 3. Assign the teacher to multiple standard-subject combinations
 */
export class AddTeacherDto {
  // User details
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the teacher'
  })
  @Expose()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'Email address for the teacher (must be unique)'
  })
  @Expose()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email_id: string;

  @ApiProperty({ 
    example: 'Password123!',
    description: 'Password must be at least 8 characters long with uppercase, lowercase, number and special character'
  })
  @Expose()
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ 
    example: '+911234567890', 
    description: 'Contact number with country code' 
  })
  @Expose()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number with country code' })
  @IsNotEmpty({ message: 'Contact number is required' })
  contact_number: string;

  @ApiPropertyOptional({ 
    example: '+919876543210', 
    description: 'Optional alternate contact number with country code' 
  })
  @Expose()
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number with country code' })
  alternate_contact_number?: string;

  @ApiPropertyOptional({ 
    example: 'M.Tech',
    description: 'Highest educational qualification of the teacher'
  })
  @Expose()
  @IsOptional()
  @IsString({ message: 'Qualification must be a string' })
  @Length(2, 50, { message: 'Qualification must be between 2 and 50 characters' })
  highest_qualification?: string;

  @ApiProperty({ 
    example: true, 
    default: true,
    description: 'Account status (active/inactive)'
  })
  @Expose()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Status must be a boolean' })
  status: boolean = true;

  // School assignment
  @ApiProperty({ 
    example: 1, 
    description: 'ID of the school to assign the teacher to'
  })
  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsNumber({}, { message: 'School ID must be a number' })
  @IsNotEmpty({ message: 'School ID is required' })
  school_id: number;

  @ApiProperty({ 
    example: '2023-01-01', 
    description: 'Start date for the teacher at the school' 
  })
  @Expose()
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  start_date: Date;

  @ApiPropertyOptional({ 
    example: '2024-12-31', 
    description: 'Optional end date for the teacher at the school' 
  })
  @Expose()
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  end_date?: Date;

  // Standard and subject assignments
  @ApiProperty({ 
    description: 'Array of standard and subject assignments', 
    type: [StandardSubjectsDto],
    example: [
      { schoolStandardId: 1, subjectIds: [1, 2] },
      { schoolStandardId: 2, subjectIds: [3, 4] }
    ]
  })
  @Expose()
  @IsArray({ message: 'Standard-subject assignments must be an array' })
  @Type(() => StandardSubjectsDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one standard-subject assignment must be specified' })
  standard_subjects: StandardSubjectsDto[];
} 