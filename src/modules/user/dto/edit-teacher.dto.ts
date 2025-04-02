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
  ArrayMinSize,
  IsPositive
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsStrongPassword } from '../../../common/validators/password.validator';

/**
 * DTO for standard and subject assignments for editing a teacher
 * Each entry represents one school-standard with multiple subject assignments
 */
export class EditStandardSubjectsDto {
  @ApiProperty({ 
    description: 'ID of the school_standard entry (not the standard ID itself). This ID comes from the School_Standard table which maps standards to schools.', 
    example: 1 
  })
  @IsNumber()
  @IsNotEmpty()
  schoolStandardId: number;

  @ApiProperty({ 
    description: 'Array of subject IDs to assign to the teacher for this standard. The system will automatically create entries for all available instruction mediums.', 
    type: [Number], 
    example: [1, 2, 3] 
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'At least one subject must be specified' })
  subjectIds: number[];
}

/**
 * DTO for editing a teacher with updated school and subject assignments
 * 
 * This DTO captures all information needed to:
 * 1. Update user details
 * 2. Update school assignment
 * 3. Update standard-subject assignments
 * 
 * All fields are optional to allow partial updates
 */
export class EditTeacherDto {
  @ApiProperty({
    description: 'ID of the teacher to edit',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  id: number;

  // User details - all optional
  @ApiPropertyOptional({ 
    example: 'John Doe',
    description: 'Full name of the teacher'
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({ 
    example: 'john.doe@example.com',
    description: 'Email address for the teacher (must be unique)'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email_id?: string;

  @ApiPropertyOptional({ 
    example: 'Password123!',
    description: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character. Only provide this if you want to change the password.'
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword()
  password?: string;

  @ApiPropertyOptional({ 
    example: '+911234567890', 
    description: 'Contact number with country code' 
  })
  @IsOptional()
  @IsPhoneNumber()
  contact_number?: string;

  @ApiPropertyOptional({ 
    example: '+919876543210', 
    description: 'Optional alternate contact number with country code' 
  })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;

  @ApiPropertyOptional({ 
    example: 'M.Tech',
    description: 'Highest educational qualification of the teacher'
  })
  @IsOptional()
  @IsString({ message: 'Qualification must be a string' })
  @Length(2, 50, { message: 'Qualification must be between 2 and 50 characters' })
  highest_qualification?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Account status (active/inactive)'
  })
  @IsOptional()
  @IsBoolean({ message: 'Status must be a boolean' })
  status?: boolean;

  // School assignment
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'ID of the school to assign the teacher to. The teacher will be associated with this school.'
  })
  @IsOptional()
  @IsNumber()
  school_id?: number;

  @ApiPropertyOptional({ 
    example: '2023-01-01', 
    description: 'Start date for the teacher at the school (employment start date)' 
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiPropertyOptional({ 
    example: '2024-12-31', 
    description: 'Optional end date for the teacher at the school (for temporary contracts)' 
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  // Standard and subject assignments
  @ApiPropertyOptional({ 
    description: `Array of standard and subject assignments. 
    If provided, these will completely replace existing assignments.
    Each entry represents one school standard with multiple subject assignments.
    The system will automatically create entries for all available instruction mediums for each standard-subject combination.`, 
    type: [EditStandardSubjectsDto],
    example: [
      { schoolStandardId: 1, subjectIds: [1, 2] },
      { schoolStandardId: 2, subjectIds: [3, 4] }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditStandardSubjectsDto)
  @ArrayMinSize(1, { message: 'At least one standard-subject assignment must be specified' })
  standard_subjects?: EditStandardSubjectsDto[];
} 