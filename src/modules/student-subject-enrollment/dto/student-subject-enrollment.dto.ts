import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export enum EnrollmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed'
}

export class CreateStudentSubjectEnrollmentDto {
  @ApiProperty({ example: 1, description: 'Teacher Subject ID' })
  @IsNumber()
  @IsNotEmpty()
  teacher_subject_id: number;

  @ApiPropertyOptional({ example: 'I would like to enroll in this subject', description: 'Optional request message' })
  @IsString()
  @IsOptional()
  request_message?: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  @IsString()
  @IsNotEmpty()
  academic_year: string;
}

export class UpdateEnrollmentStatusDto {
  @ApiProperty({ 
    enum: EnrollmentStatus,
    example: EnrollmentStatus.APPROVED,
    description: 'New enrollment status'
  })
  @IsEnum(EnrollmentStatus)
  @IsNotEmpty()
  status: EnrollmentStatus;

  @ApiPropertyOptional({ 
    example: 'Request approved. Welcome to the class!',
    description: 'Optional response from teacher'
  })
  @IsString()
  @IsOptional()
  teacher_response?: string;
}

export class GetEnrollmentsQueryDto {
  @ApiPropertyOptional({ 
    enum: EnrollmentStatus,
    description: 'Filter by enrollment status'
  })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filter by student ID'
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  student_id?: number;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Filter by teacher subject ID'
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  teacher_subject_id?: number;

  @ApiPropertyOptional({ 
    example: '2024-2025',
    description: 'Filter by academic year'
  })
  @IsString()
  @IsOptional()
  academic_year?: string;
}

export class StudentSubjectEnrollmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  student_id: number;

  @ApiProperty({ example: 1 })
  teacher_subject_id: number;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.PENDING })
  status: EnrollmentStatus;

  @ApiPropertyOptional({ example: 'I would like to enroll in this subject' })
  request_message?: string;

  @ApiPropertyOptional({ example: 'Request approved. Welcome to the class!' })
  teacher_response?: string;

  @ApiProperty({ example: '2024-2025' })
  academic_year: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  requested_at: Date;

  @ApiPropertyOptional({ example: '2024-01-16T14:20:00Z' })
  responded_at?: Date;

  @ApiPropertyOptional({ example: '2024-01-16' })
  enrollment_date?: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-16T14:20:00Z' })
  updated_at: Date;

  // Related data
  student?: {
    id: number;
    user: {
      id: number;
      name: string;
      email_id: string;
    };
  };

  teacher_subject?: {
    id: number;
    user: {
      id: number;
      name: string;
      email_id: string;
    };
    subject: {
      id: number;
      name: string;
    };
    school_standard: {
      id: number;
      standard: {
        id: number;
        name: string;
      };
      school: {
        id: number;
        name: string;
      };
    };
  };
} 