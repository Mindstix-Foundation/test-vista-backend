# Student Exam API Documentation

This document describes the API endpoints created for student exam functionality, corresponding to the frontend pages: `DetailedReport.vue`, `Instructions.vue`, `Result.vue`, and `TakeExam.vue`.

## Base URL
All endpoints are prefixed with `/test-assignment`

## Authentication
All endpoints require authentication. The JWT token should be passed in the Authorization header as `Bearer <token>`.

## Endpoints

### 1. Get Student Assigned Tests
**GET** `/test-assignment/student/assigned-tests`

Retrieves all tests assigned to the authenticated student.

**Query Parameters:**
- `status` (optional): Filter by test status (`assigned`, `active`, `completed`, `expired`)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Mathematics Unit Test",
    "status": "assigned",
    "dueDate": "2024-01-15T10:00:00Z",
    "availableDate": "2024-01-10T09:00:00Z",
    "duration": 120,
    "questions": 50,
    "maxScore": 100,
    "progress": 0,
    "remainingTime": null,
    "subject": "Mathematics",
    "standard": "Class 10",
    "assignedBy": "John Teacher"
  }
]
```

### 2. Get Exam Instructions
**GET** `/test-assignment/student/exam/:assignmentId/instructions`

Retrieves detailed instructions for a specific exam.

**Path Parameters:**
- `assignmentId`: The ID of the test assignment

**Response:**
```json
{
  "id": 1,
  "title": "Mathematics Unit Test",
  "subject": "Mathematics",
  "standard": "Class 10",
  "duration_minutes": 120,
  "total_questions": 50,
  "total_marks": 100,
  "instructions": "Read all questions carefully...",
  "negative_marking": true,
  "negative_marks_per_question": 0.25,
  "max_attempts": 1,
  "available_from": "2024-01-10T09:00:00Z",
  "due_date": "2024-01-15T10:00:00Z",
  "status": "assigned"
}
```

### 3. Start Exam
**POST** `/test-assignment/student/start-exam`

Starts an exam and creates a test attempt.

**Request Body:**
```json
{
  "assignment_id": 1
}
```

**Response:**
```json
{
  "assignment_id": 1,
  "test_paper_id": 5,
  "title": "Mathematics Unit Test",
  "subject": "Mathematics",
  "standard": "Class 10",
  "duration_minutes": 120,
  "total_marks": 100,
  "instructions": "Read all questions carefully...",
  "negative_marking": true,
  "negative_marks_per_question": 0.25,
  "questions": [
    {
      "id": 1,
      "question_id": 10,
      "question_text_id": 15,
      "question_text": "What is 2 + 2?",
      "question_image": null,
      "options": ["2", "3", "4", "5"],
      "option_images": [null, null, null, null],
      "section_id": 1,
      "subsection_id": 1,
      "question_order": 1,
      "marks": 2,
      "is_mandatory": true
    }
  ],
  "start_time": "2024-01-12T10:00:00Z",
  "attempt_number": 1
}
```

### 4. Get Exam Attempt Status
**GET** `/test-assignment/student/exam-attempt/:attemptId/status`

Gets the current status of an ongoing exam attempt.

**Path Parameters:**
- `attemptId`: The ID of the test attempt

**Response:**
```json
{
  "test_attempt_id": 1,
  "status": "in_progress",
  "current_question": 5,
  "time_remaining_seconds": 3600,
  "questions_answered": 4,
  "total_questions": 50
}
```

### 5. Submit Answer
**POST** `/test-assignment/student/submit-answer`

Submits or updates an answer for a specific question.

**Request Body:**
```json
{
  "test_attempt_id": 1,
  "question_id": 10,
  "question_text_id": 15,
  "selected_option_id": 42,
  "time_spent_seconds": 30,
  "is_flagged": false
}
```

**Response:**
```json
{
  "message": "Answer submitted successfully"
}
```

### 6. Submit Exam
**POST** `/test-assignment/student/submit-exam`

Submits the complete exam for evaluation.

**Request Body:**
```json
{
  "test_attempt_id": 1,
  "answers": [
    {
      "question_id": 10,
      "question_text_id": 15,
      "selected_option_id": 42,
      "time_spent_seconds": 30,
      "is_flagged": false
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "test_attempt_id": 1,
  "title": "Mathematics Unit Test",
  "subject": "Mathematics",
  "total_questions": 50,
  "attempted_questions": 48,
  "correct_answers": 35,
  "wrong_answers": 13,
  "skipped_questions": 2,
  "total_marks": 100,
  "obtained_marks": 67.75,
  "percentage": 67.75,
  "grade": "B+",
  "rank_in_standard": 15,
  "time_taken_seconds": 6300,
  "performance_level": "good",
  "chapter_wise_analysis": {
    "Algebra": { "correct": 8, "total": 10, "percentage": 80 },
    "Geometry": { "correct": 12, "total": 15, "percentage": 80 }
  },
  "strengths": ["Algebra", "Statistics"],
  "weaknesses": ["Trigonometry", "Calculus"],
  "recommendations": ["Practice more trigonometry problems"],
  "submitted_at": "2024-01-12T12:05:00Z"
}
```

### 7. Get Exam Result
**GET** `/test-assignment/student/exam-result/:attemptId`

Retrieves the result of a completed exam.

**Path Parameters:**
- `attemptId`: The ID of the test attempt

**Response:** Same as Submit Exam response

### 8. Get Detailed Report
**GET** `/test-assignment/student/detailed-report/:attemptId`

Retrieves a detailed question-by-question analysis of the exam.

**Path Parameters:**
- `attemptId`: The ID of the test attempt

**Response:**
```json
{
  "result": {
    // Same as exam result response
  },
  "question_analysis": [
    {
      "question_id": 10,
      "question_text": "What is 2 + 2?",
      "question_image": null,
      "options": ["2", "3", "4", "5"],
      "correct_option": "4",
      "selected_option": "4",
      "is_correct": true,
      "marks_obtained": 2,
      "time_spent_seconds": 30,
      "is_flagged": false,
      "chapter": "Basic Arithmetic",
      "topic": "Addition"
    }
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request data",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized access",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Resource conflict",
  "error": "Conflict"
}
```

## Usage Flow

1. **Get Assigned Tests**: Student views their assigned tests
2. **Get Instructions**: Student reads exam instructions before starting
3. **Start Exam**: Student starts the exam, creating a test attempt
4. **Submit Answers**: Student submits answers for individual questions
5. **Get Status**: Frontend can check exam status and time remaining
6. **Submit Exam**: Student submits the complete exam
7. **Get Result**: Student views their exam result
8. **Get Detailed Report**: Student views detailed question analysis

## Security Features

- JWT-based authentication required for all endpoints
- Student can only access their own assignments and attempts
- Time-based validation for exam availability
- Attempt limits enforced
- Automatic exam submission when time expires

## Database Models Used

- `Student`: Student profile information
- `Test_Assignment`: Test assignments to students
- `Test_Attempt`: Individual exam attempts
- `Student_Answer`: Student answers for questions
- `Student_Result`: Calculated exam results
- `Test_Paper`: Test paper configuration
- `Question`: Question definitions
- `Question_Text`: Question content in different languages
- `Mcq_Option`: Multiple choice options

## Frontend Integration

These APIs are designed to work with the following Vue.js components:

- **Instructions.vue**: Uses `/exam/:assignmentId/instructions`
- **TakeExam.vue**: Uses `/start-exam`, `/submit-answer`, `/exam-attempt/:attemptId/status`, `/submit-exam`
- **Result.vue**: Uses `/exam-result/:attemptId`
- **DetailedReport.vue**: Uses `/detailed-report/:attemptId` 