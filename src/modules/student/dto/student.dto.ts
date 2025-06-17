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
  IsDateString,
  IsInt,
  Min
} from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/password.validator';
import { Type } from 'class-transformer';

export class StudentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  contact_number: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  alternate_contact_number?: string;

  @ApiProperty({ example: 'STU001' })
  @IsString()
  student_id: string;

  @ApiPropertyOptional({ example: '2005-06-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  school_standard_id: number;
}

export class CreateStudentDto {
  @ApiProperty({ 
    example: 'Password123!',
    description: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @ApiProperty({ example: '+911234567890', description: 'Contact number with country code' })
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number is required' })
  contact_number: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;

  @ApiProperty({ example: 'STU001', description: 'Student ID/Roll Number' })
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID is required' })
  @Length(3, 20, { message: 'Student ID must be between 3 and 20 characters' })
  student_id: string;

  @ApiPropertyOptional({ example: '2005-06-15', description: 'Date of birth in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  date_of_birth?: string;

  @ApiProperty({ example: 1, description: 'School Standard ID (combination of school and standard)' })
  @IsInt({ message: 'School Standard ID must be an integer' })
  @Min(1, { message: 'School Standard ID must be greater than 0' })
  @Type(() => Number)
  school_standard_id: number;

  @ApiPropertyOptional({ example: 'active', description: 'Student status' })
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string = 'active';
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty if provided' })
  email_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty if provided' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @ApiPropertyOptional({ example: '+911234567890', description: 'Contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Contact number cannot be empty if provided' })
  contact_number?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Alternate contact number with country code' })
  @IsOptional()
  @IsPhoneNumber()
  alternate_contact_number?: string;

  @ApiPropertyOptional({ example: 'STU001', description: 'Student ID/Roll Number' })
  @IsOptional()
  @IsString({ message: 'Student ID must be a string' })
  @IsNotEmpty({ message: 'Student ID cannot be empty if provided' })
  @Length(3, 20, { message: 'Student ID must be between 3 and 20 characters' })
  student_id?: string;

  @ApiPropertyOptional({ example: '2005-06-15', description: 'Date of birth in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  date_of_birth?: string;

  @ApiPropertyOptional({ example: 1, description: 'School Standard ID (combination of school and standard)' })
  @IsOptional()
  @IsInt({ message: 'School Standard ID must be an integer' })
  @Min(1, { message: 'School Standard ID must be greater than 0' })
  @Type(() => Number)
  school_standard_id?: number;

  @ApiPropertyOptional({ example: 'active', description: 'Student status' })
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;
}

export class StudentListDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'STU001' })
  @IsString()
  student_id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsString()
  email_id: string;

  @ApiProperty({ example: 'Delhi Public School' })
  @IsString()
  school_name: string;

  @ApiProperty({ example: 'Standard 10' })
  @IsString()
  standard_name: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  enrollment_date: string;
}

export class StudentDetailDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  contact_number: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  alternate_contact_number?: string;

  @ApiProperty({ example: 'STU001' })
  @IsString()
  student_id: string;

  @ApiPropertyOptional({ example: '2005-06-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  enrollment_date: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  school_standard_id: number;

  @ApiProperty()
  school: {
    id: number;
    name: string;
    board: {
      id: number;
      name: string;
      abbreviation: string;
    };
  };

  @ApiProperty()
  standard: {
    id: number;
    name: string;
    sequence_number: number;
  };

  @ApiPropertyOptional()
  recent_assignments?: Array<{
    id: number;
    test_paper: {
      id: number;
      name: string;
    };
    assigned_date: string;
    due_date: string;
    status: string;
  }>;

  @ApiPropertyOptional()
  analytics?: {
    total_tests_taken: number;
    total_practice_tests: number;
    average_score?: number;
    best_score?: number;
    worst_score?: number;
    last_score?: number;
  };

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: string;
} 