# Student Management API Documentation

## Overview
This document provides comprehensive information about the Student Management API that has been implemented for the Test Vista application. The API provides full CRUD operations for student management along with additional features like availability checks.

## Features Implemented

### 1. Student Module Structure
- **StudentController**: Handles all HTTP requests for student operations
- **StudentService**: Contains business logic for student management
- **Student DTOs**: Data Transfer Objects for validation and documentation
- **StudentModule**: NestJS module configuration

### 2. Database Schema
The following tables have been created for student management:

#### Student Table
- Primary student profile information
- Links to User table (one-to-one relationship)
- Links to School_Standard table
- Unique constraint on student_id + school_standard_id

#### Supporting Tables
- **Test_Assignment**: Manages test assignments to students
- **Test_Attempt**: Tracks student attempts on tests
- **Practice_Attempt**: Manages practice test attempts
- **Student_Answer**: Stores student answers for assigned tests
- **Practice_Answer**: Stores student answers for practice tests
- **Student_Result**: Comprehensive test results and analytics
- **Student_Analytics**: Performance tracking and statistics
- **Student_Notification**: Student notifications system

### 3. API Endpoints

#### Student CRUD Operations

##### POST /students
- **Purpose**: Create a new student (Student Registration)
- **Authorization**: Public endpoint (no authentication required)
- **Body**: CreateStudentDto
- **Response**: Created student details

##### GET /students
- **Purpose**: Get all students with optional filtering, pagination, and search
- **Authorization**: Requires ADMIN or TEACHER role
- **Query Parameters**:
  - `schoolId` (optional): Filter by school ID
  - `standardId` (optional): Filter by standard ID
  - `status` (optional): Filter by student status
  - `page` (optional): Page number for pagination
  - `page_size` (optional): Items per page
  - `sort_by` (optional): Field to sort by (name, created_at, updated_at)
  - `sort_order` (optional): Sort order (asc, desc)
  - `search` (optional): Search by student name or student ID
- **Response**: Paginated list of students or all students if pagination not specified

##### GET /students/:id
- **Purpose**: Get detailed student information by ID
- **Authorization**: Requires ADMIN or TEACHER role
- **Response**: Detailed student information including school, standard, recent assignments, and analytics

##### PUT /students/:id
- **Purpose**: Update student information
- **Authorization**: Requires ADMIN role
- **Body**: UpdateStudentDto
- **Response**: Updated student details

##### DELETE /students/:id
- **Purpose**: Delete a student
- **Authorization**: Requires ADMIN role
- **Response**: No content (204)

#### Utility Endpoints

##### GET /students/check-student-id/:studentId/:schoolStandardId
- **Purpose**: Check if a student ID is available in a specific school-standard
- **Authorization**: Public endpoint
- **Response**: Availability status and message

##### GET /students/by-school/:schoolId
- **Purpose**: Get all students in a specific school
- **Authorization**: Requires ADMIN or TEACHER role
- **Query Parameters**: `standardId`, `status`, `search`
- **Response**: List of students in the specified school

##### GET /students/by-standard/:standardId
- **Purpose**: Get all students in a specific standard
- **Authorization**: Requires ADMIN or TEACHER role
- **Query Parameters**: `schoolId`, `status`, `search`
- **Response**: List of students in the specified standard

### 4. Data Transfer Objects (DTOs)

#### CreateStudentDto
- `email_id`: Email address (required, unique)
- `password`: Strong password (required)
- `name`: Full name (required, 2-100 characters)
- `contact_number`: Phone number with country code (required)
- `alternate_contact_number`: Alternate phone number (optional)
- `student_id`: Student ID/Roll Number (required, 3-20 characters)
- `date_of_birth`: Date of birth in YYYY-MM-DD format (optional)
- `school_standard_id`: School-Standard combination ID (required)
- `status`: Student status (optional, defaults to 'active')

#### UpdateStudentDto
- All fields from CreateStudentDto but optional
- Used for partial updates

#### StudentListDto
- Simplified student information for list views
- Includes: id, name, student_id, email_id, school_name, standard_name, status, enrollment_date

#### StudentDetailDto
- Comprehensive student information for detailed views
- Includes all student fields plus school, standard, recent assignments, and analytics

### 5. Authentication & Authorization

#### Roles
- **ADMIN**: Full access to all student operations
- **TEACHER**: Read access to student information
- **STUDENT**: Role created for student users (for future student-specific endpoints)

#### Guards
- **JwtAuthGuard**: Validates JWT tokens
- **RolesGuard**: Enforces role-based access control

### 6. Validation & Error Handling

#### Input Validation
- Email format validation
- Strong password requirements
- Phone number validation
- Length constraints on text fields
- Date format validation

#### Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Student/Resource not found
- **409 Conflict**: Email or Student ID already exists
- **500 Internal Server Error**: Server-side errors

### 7. Database Relationships

#### Student Relationships
- **User**: One-to-one relationship (student extends user)
- **School_Standard**: Many-to-one relationship
- **Test_Assignment**: One-to-many relationship
- **Test_Attempt**: One-to-many relationship
- **Practice_Attempt**: One-to-many relationship
- **Student_Result**: One-to-many relationship
- **Student_Analytics**: One-to-one relationship
- **Student_Notification**: One-to-many relationship

### 8. Business Logic Features

#### Student Creation
- Automatic password hashing
- Role assignment (STUDENT role)
- Email and Student ID uniqueness validation
- School-Standard validation

#### Search & Filtering
- Full-text search on student name and student ID
- Filter by school, standard, and status
- Sorting by multiple fields
- Pagination support

#### Data Security
- Password hashing using bcrypt
- Sensitive data exclusion in responses
- Cascade delete protection

### 9. Usage Examples

#### Create a Student (Registration)
```bash
POST /students
Content-Type: application/json

{
  "email_id": "john.doe@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "contact_number": "+911234567890",
  "student_id": "STU001",
  "date_of_birth": "2005-06-15",
  "school_standard_id": 1
}
```

#### Get Students with Filtering
```bash
GET /students?schoolId=1&status=active&search=john&page=1&page_size=10
Authorization: Bearer <admin_or_teacher_token>
```

### 10. Migration Information

#### Migration: 20250617102422_add_student_role
- Created all student-related tables
- Added foreign key constraints
- Added unique constraints
- Inserted STUDENT role into Role table

### 11. Future Enhancements

#### Potential Features
- Student dashboard endpoints
- Test performance analytics
- Notification management
- Parent/Guardian management
- Bulk student import/export
- Student profile picture upload
- Academic year management
- Grade calculation system
- Student self-registration functionality

#### Security Enhancements
- Two-factor authentication
- Email verification
- Password reset functionality
- Account lockout policies
- Audit logging

### 12. Testing Recommendations

#### Unit Tests
- Service method testing
- DTO validation testing
- Error handling testing

#### Integration Tests
- API endpoint testing
- Database transaction testing
- Authentication/authorization testing

#### E2E Tests
- Complete student management workflows
- Role-based access testing

---

## Technical Notes

### Dependencies Added
- No new external dependencies were required
- Used existing validation decorators and guards
- Leveraged existing Prisma setup

### Performance Considerations
- Database indexes on frequently queried fields
- Pagination to handle large datasets
- Efficient query relationships using Prisma includes
- Proper cascade delete configurations

### Maintenance
- Regular monitoring of student data patterns
- Database performance optimization
- Security audit of authentication flows
- Regular backup of student data

---

This implementation provides a robust foundation for student management in the Test Vista application, with comprehensive CRUD operations, security measures, and extensibility for future enhancements. 