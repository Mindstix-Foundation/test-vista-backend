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

  @ApiProperty({ example: 'Dec 20, 2024 at 10:00 AM' })
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

// New DTOs for student exam functionality

export class ExamInstructionsDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mathematics Final Exam' })
  title: string;

  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 'Class 10' })
  standard: string;

  @ApiProperty({ example: 60 })
  duration_minutes: number;

  @ApiProperty({ example: 25 })
  total_questions: number;

  @ApiProperty({ example: 100 })
  total_marks: number;

  @ApiProperty({ example: 'Please read all questions carefully before answering.' })
  instructions?: string;

  @ApiProperty({ example: true })
  negative_marking: boolean;

  @ApiProperty({ example: 0.25 })
  negative_marks_per_question?: number;

  @ApiProperty({ example: 1 })
  max_attempts: number;

  @ApiProperty({ example: 1, description: 'Number of attempts remaining' })
  attempts_left: number;

  @ApiProperty({ example: '2024-01-20T10:00:00Z' })
  available_from: Date;

  @ApiProperty({ example: '2024-01-25T18:00:00Z' })
  due_date: Date;

  @ApiProperty({ example: 'assigned' })
  status: string;
}

export class ExamQuestionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  question_id: number;

  @ApiProperty({ example: 1 })
  question_text_id: number;

  @ApiProperty({ example: 'What is the square root of 144?' })
  question_text: string;

  @ApiProperty({ example: 'image_url_here' })
  question_image?: string;

  @ApiProperty({ example: ['10', '11', '12', '13'] })
  options: string[];

  @ApiProperty({ example: [1, 2, 3, 4] })
  option_ids: number[];

  @ApiProperty({ example: ['option1_image_url', null, null, null] })
  option_images?: (string | null)[];

  @ApiProperty({ example: 1 })
  section_id: number;

  @ApiProperty({ example: 1 })
  subsection_id: number;

  @ApiProperty({ example: 1 })
  question_order: number;

  @ApiProperty({ example: 4 })
  marks: number;

  @ApiProperty({ example: true })
  is_mandatory: boolean;
}

export class ExamDataDto {
  @ApiProperty({ example: 1 })
  assignment_id: number;

  @ApiProperty({ example: 1 })
  test_paper_id: number;

  @ApiProperty({ example: 'Mathematics Final Exam' })
  title: string;

  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 'Class 10' })
  standard: string;

  @ApiProperty({ example: 60 })
  duration_minutes: number;

  @ApiProperty({ example: 100 })
  total_marks: number;

  @ApiProperty({ example: 'Please read all questions carefully.' })
  instructions?: string;

  @ApiProperty({ example: true })
  negative_marking: boolean;

  @ApiProperty({ example: 0.25 })
  negative_marks_per_question?: number;

  @ApiProperty({ example: false, description: 'Whether questions are randomized for this student' })
  randomize_questions: boolean;

  @ApiProperty({ example: false, description: 'Whether options are randomized for this student' })
  randomize_options: boolean;

  @ApiProperty({ type: [ExamQuestionDto] })
  questions: ExamQuestionDto[];

  @ApiProperty({ example: '2024-01-20T10:00:00Z' })
  start_time: Date;

  @ApiProperty({ example: 1 })
  attempt_number: number;

  @ApiProperty({ example: 1 })
  attemptId: number;
}

export class StartExamDto {
  @ApiProperty({ example: 1, description: 'Test assignment ID' })
  @IsNumber()
  @IsNotEmpty()
  assignment_id: number;
}

export class SubmitAnswerDto {
  @ApiProperty({ example: 1, description: 'Test attempt ID' })
  @IsNumber()
  @IsNotEmpty()
  test_attempt_id: number;

  @ApiProperty({ example: 1, description: 'Question ID' })
  @IsNumber()
  @IsNotEmpty()
  question_id: number;

  @ApiProperty({ example: 1, description: 'Question text ID' })
  @IsNumber()
  @IsNotEmpty()
  question_text_id: number;

  @ApiProperty({ example: 2, description: 'Selected option ID (0-based index)' })
  @IsNumber()
  @IsOptional()
  selected_option_id?: number;

  @ApiProperty({ example: 30000, description: 'Time spent on this question in milliseconds' })
  @IsNumber()
  @IsOptional()
  time_spent_seconds?: number;

  @ApiProperty({ example: false, description: 'Whether question is flagged for review' })
  @IsBoolean()
  @IsOptional()
  is_flagged?: boolean;
}

export class SubmitExamDto {
  @ApiProperty({ example: 1, description: 'Test attempt ID' })
  @IsNumber()
  @IsNotEmpty()
  test_attempt_id: number;
}

export class SubmitExamResponseDto {
  @ApiProperty({ example: 'Exam submitted successfully' })
  message: string;

  @ApiProperty({ example: 1 })
  test_attempt_id: number;

  @ApiProperty({ example: '2024-01-20T11:30:00Z' })
  submitted_at: Date;
}

export class ExamResultDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  test_attempt_id: number;

  @ApiProperty({ example: 'Mathematics Final Exam' })
  title: string;

  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 25 })
  total_questions: number;

  @ApiProperty({ example: 20 })
  attempted_questions: number;

  @ApiProperty({ example: 18 })
  correct_answers: number;

  @ApiProperty({ example: 2 })
  wrong_answers: number;

  @ApiProperty({ example: 5 })
  skipped_questions: number;

  @ApiProperty({ example: 100 })
  total_marks: number;

  @ApiProperty({ example: 85.5 })
  obtained_marks: number;

  @ApiProperty({ example: 85.5 })
  percentage: number;

  @ApiProperty({ example: 'A' })
  grade?: string;

  @ApiProperty({ example: 3 })
  rank_in_standard?: number;

  @ApiProperty({ example: 3420 })
  time_taken_seconds: number;

  @ApiProperty({ example: 'excellent' })
  performance_level: string;

  @ApiProperty({ 
    example: {
      'Chapter 1': { correct: 8, total: 10, percentage: 80 },
      'Chapter 2': { correct: 10, total: 15, percentage: 66.67 }
    }
  })
  chapter_wise_analysis?: any;

  @ApiProperty({ example: ['Algebra', 'Geometry'] })
  strengths?: string[];

  @ApiProperty({ example: ['Trigonometry'] })
  weaknesses?: string[];

  @ApiProperty({ example: ['Practice more trigonometry problems'] })
  recommendations?: string[];

  @ApiProperty({ example: '2024-01-20T11:30:00Z' })
  submitted_at: Date;
}

export class DetailedReportDto {
  @ApiProperty({ type: ExamResultDto })
  result: ExamResultDto;

  @ApiProperty({ 
    example: [
      {
        question_id: 1,
        question_text: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        option_ids: [101, 102, 103, 104],
        correct_option: 1,
        selected_option: 102,
        selected_option_index: 1,
        is_correct: true,
        marks_obtained: 4,
        time_spent_seconds: 30,
        is_flagged: false
      }
    ]
  })
  questions: {
    question_id: number;
    question_text: string;
    question_image?: string;
    options: string[];
    option_images?: (string | null)[];
    option_ids: number[];
    correct_option: number;
    selected_option?: number;
    selected_option_index: number;
    is_correct?: boolean;
    marks_obtained: number;
    time_spent_seconds?: number;
    is_flagged: boolean;
  }[];
}

export class TestAttemptStatusDto {
  @ApiProperty({ example: 1 })
  test_attempt_id: number;

  @ApiProperty({ example: 'in_progress' })
  status: string;

  @ApiProperty({ example: 5 })
  current_question?: number;

  @ApiProperty({ example: 2400 })
  time_remaining_seconds?: number;

  @ApiProperty({ example: 10 })
  questions_answered: number;

  @ApiProperty({ example: 25 })
  total_questions: number;
}

export class TestPaperResultDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: 'John Doe' })
  student_name: string;

  @ApiProperty({ example: 'ST001' })
  roll_number: string;

  @ApiProperty({ example: 85.5 })
  marks_obtained: number;

  @ApiProperty({ example: 100 })
  total_marks: number;

  @ApiProperty({ example: 3420 })
  time_taken_seconds: number;

  @ApiProperty({ example: 85.5 })
  percentage: number;

  @ApiProperty({ example: 'completed', enum: ['completed', 'pending'] })
  status: string;

  @ApiProperty({ example: '2024-01-20T11:30:00Z' })
  submitted_at?: Date;

  @ApiProperty({ example: 1 })
  student_id: number;

  @ApiProperty({ example: 1 })
  test_attempt_id?: number;
}

export class TestPaperResultsResponseDto {
  @ApiProperty({ example: 1 })
  test_paper_id: number;

  @ApiProperty({ example: 'Mathematics Final Exam' })
  test_paper_name: string;

  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 'Class 10' })
  standard: string;

  @ApiProperty({ example: 100 })
  total_marks: number;

  @ApiProperty({ example: 60 })
  duration_minutes: number;

  @ApiProperty({ example: 25 })
  total_students: number;

  @ApiProperty({ example: 18 })
  completed_students: number;

  @ApiProperty({ example: 7 })
  pending_students: number;

  @ApiProperty({ example: 92.5 })
  highest_score: number;

  @ApiProperty({ example: 76.8 })
  average_score: number;

  @ApiProperty({ example: 45.2 })
  lowest_score: number;

  @ApiProperty({ example: 72.0 })
  pass_rate: number;

  @ApiProperty({ type: [TestPaperResultDto] })
  results: TestPaperResultDto[];
} 