import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, IsNotEmpty, IsBoolean } from 'class-validator';
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

export class GetEnrolledStudentsQueryDto {
  @ApiProperty({ 
    example: 1,
    description: 'Standard ID to filter students'
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  standard_id: number;

  @ApiProperty({ 
    example: 1,
    description: 'Subject ID to filter students'
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  subject_id: number;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Test paper ID to filter students by assignment status'
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  paper_id?: number;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Filter students by assignment status - true for assigned students, false for non-assigned students. Only works when paper_id is provided.'
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  assigned_only?: boolean;
}

export class EnrolledStudentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  student_id: number;

  @ApiProperty({ example: 'STU001' })
  student_roll_number: string;

  @ApiProperty({ example: 'John Doe' })
  student_name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  student_email: string;

  @ApiProperty({ example: '2024-2025' })
  academic_year: string;

  @ApiProperty({ example: '2024-01-16' })
  enrollment_date: Date;

  @ApiProperty({ 
    example: {
      id: 1,
      name: 'Mathematics'
    }
  })
  subject: {
    id: number;
    name: string;
  };

  @ApiProperty({ 
    example: {
      id: 1,
      name: 'Standard 10'
    }
  })
  standard: {
    id: number;
    name: string;
  };

  @ApiProperty({ 
    example: {
      id: 1,
      name: 'ABC School'
    }
  })
  school: {
    id: number;
    name: string;
  };
}

export class SubjectStatsDto {
  @ApiProperty({ example: 2, description: 'Number of pending enrollment requests' })
  pending: number;

  @ApiProperty({ example: 5, description: 'Number of approved enrollment requests' })
  approved: number;

  @ApiProperty({ example: 8, description: 'Number of active enrollments' })
  active: number;

  @ApiProperty({ example: 1, description: 'Number of rejected enrollment requests' })
  rejected: number;

  @ApiProperty({ example: 0, description: 'Number of inactive enrollments' })
  inactive: number;

  @ApiProperty({ example: 0, description: 'Number of completed enrollments' })
  completed: number;

  @ApiProperty({ example: 16, description: 'Total number of enrollment requests' })
  total: number;
}

export class TeacherSubjectSummaryDto {
  @ApiProperty({ example: 1, description: 'Subject ID' })
  id: number;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  name: string;

  @ApiProperty({ example: 3, description: 'Teacher Subject ID' })
  teacherSubjectId: number;

  @ApiProperty({ type: SubjectStatsDto, description: 'Enrollment statistics for this subject' })
  stats: SubjectStatsDto;
}

export class StandardSummaryDto {
  @ApiProperty({ example: 1, description: 'Standard ID' })
  id: number;

  @ApiProperty({ example: 'Standard 10', description: 'Standard name' })
  name: string;

  @ApiProperty({ example: 3, description: 'Number of subjects taught in this standard' })
  subjectCount: number;

  @ApiProperty({ 
    example: {
      id: 1,
      name: 'ABC School'
    },
    description: 'School information'
  })
  school: {
    id: number;
    name: string;
  };

  @ApiProperty({ 
    type: [TeacherSubjectSummaryDto], 
    description: 'List of subjects with enrollment statistics' 
  })
  subjects: TeacherSubjectSummaryDto[];
} 