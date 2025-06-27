import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTestAssignmentDto {
  @ApiProperty({ example: 1, description: 'Student ID' })
  @IsNumber()
  @IsNotEmpty()
  student_id: number;

  @ApiProperty({ example: 1, description: 'Test Paper ID' })
  @IsNumber()
  @IsNotEmpty()
  test_paper_id: number;

  @ApiProperty({ example: '2024-01-20T10:00:00Z', description: 'Test due date' })
  @IsDateString()
  @IsNotEmpty()
  due_date: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z', description: 'Test available from date' })
  @IsDateString()
  @IsNotEmpty()
  available_from: string;

  @ApiPropertyOptional({ example: 1, description: 'Maximum attempts allowed', default: 1 })
  @IsNumber()
  @IsOptional()
  max_attempts?: number;

  @ApiPropertyOptional({ example: 60, description: 'Time limit in minutes (overrides test paper time limit)' })
  @IsNumber()
  @IsOptional()
  time_limit_minutes?: number;
}

export class BulkAssignTestDto {
  @ApiProperty({ example: [1, 2, 3], description: 'Array of student IDs' })
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  student_ids: number[];

  @ApiProperty({ example: 1, description: 'Test Paper ID' })
  @IsNumber()
  @IsNotEmpty()
  test_paper_id: number;

  @ApiProperty({ example: '2024-01-20T10:00:00Z', description: 'Test due date' })
  @IsDateString()
  @IsNotEmpty()
  due_date: string;

  @ApiProperty({ example: '2024-01-15T08:00:00Z', description: 'Test available from date' })
  @IsDateString()
  @IsNotEmpty()
  available_from: string;

  @ApiPropertyOptional({ example: 1, description: 'Maximum attempts allowed', default: 1 })
  @IsNumber()
  @IsOptional()
  max_attempts?: number;

  @ApiPropertyOptional({ example: 60, description: 'Time limit in minutes (overrides test paper time limit)' })
  @IsNumber()
  @IsOptional()
  time_limit_minutes?: number;
}

export class TestAssignmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  student_id: number;

  @ApiProperty({ example: 1 })
  test_paper_id: number;

  @ApiProperty({ example: 1 })
  assigned_by_user_id: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  assigned_date: Date;

  @ApiProperty({ example: '2024-01-20T10:00:00Z' })
  due_date: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00Z' })
  available_from: Date;

  @ApiProperty({ example: 1 })
  max_attempts: number;

  @ApiProperty({ example: 60 })
  time_limit_minutes?: number;

  @ApiProperty({ example: 'assigned' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;

  // Related data
  student?: {
    id: number;
    student_id: string;
    user: {
      id: number;
      name: string;
      email_id: string;
    };
  };

  test_paper?: {
    id: number;
    name: string;
    duration_minutes: number;
    pattern: {
      id: number;
      total_marks: number;
      subject: {
        id: number;
        name: string;
      };
      standard: {
        id: number;
        name: string;
      };
    };
  };

  assigned_by?: {
    id: number;
    name: string;
    email_id: string;
  };
}

export class GetTestAssignmentsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by student ID' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  student_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by test paper ID' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  test_paper_id?: number;

  @ApiPropertyOptional({ example: 'assigned', description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by assigned by user ID' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  assigned_by_user_id?: number;
}

export class RemoveTestAssignmentDto {
  @ApiProperty({ example: 1, description: 'Student ID' })
  @IsNumber()
  @IsNotEmpty()
  student_id: number;

  @ApiProperty({ example: 1, description: 'Test Paper ID' })
  @IsNumber()
  @IsNotEmpty()
  test_paper_id: number;
}

export class BulkRemoveTestAssignmentDto {
  @ApiProperty({ example: [1, 2, 3], description: 'Array of student IDs' })
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  student_ids: number[];

  @ApiProperty({ example: 1, description: 'Test Paper ID' })
  @IsNumber()
  @IsNotEmpty()
  test_paper_id: number;
}

export class StudentAssignedTestDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mathematics Test' })
  title: string;

  @ApiProperty({ example: 'active', enum: ['upcoming', 'active', 'completed', 'absent'] })
  status: string;

  @ApiProperty({ example: 'Dec 25, 2024' })
  dueDate: string;

  @ApiProperty({ example: 'Dec 20, 2024 at 9:00 AM' })
  availableDate: string;

  @ApiProperty({ example: 60 })
  duration: number;

  @ApiProperty({ example: 50 })
  questions: number;

  @ApiProperty({ example: 100 })
  maxScore: number;

  @ApiProperty({ example: 75 })
  progress: number;

  @ApiProperty({ example: '45:30' })
  remainingTime: string;

  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 'Class 10' })
  standard: string;

  @ApiProperty({ example: 'John Doe' })
  assignedBy: string;
} 