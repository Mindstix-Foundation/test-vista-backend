# User Module

This module handles user management, authentication, and role-based authorization in the Test Vista application.

## Key Features

- User CRUD operations
- Role management
- School and subject assignments for teachers
- Email availability checking

## API Endpoints

### User Management

- `POST /users` - Create a new user (Admin only)
- `GET /users` - Get all users with pagination and filtering (Admin only)
- `GET /users/:id` - Get a user by ID (Admin only)
- `PUT /users/:id` - Update a user (Admin only)
- `DELETE /users/:id` - Delete a user (Admin only)
- `GET /users/check-email/:email` - Check if an email is available

### Teacher Management

- `POST /users/teacher` - Add a new teacher with school and subject assignments (Admin only)
- `PUT /users/teacher` - Edit an existing teacher with updated school and subject assignments (Admin only)

## Teacher API Documentation

The teacher API is designed to streamline the process of adding and editing teachers in the system, including managing their school and subject assignments in a single operation.

### Adding a Teacher

#### Endpoint
```
POST /users/teacher
```

#### Authorization
- Requires JWT token
- ADMIN role required

#### Request Body

```json
{
  "name": "John Teacher",
  "email_id": "john.teacher@example.com",
  "password": "StrongPassword123!",
  "contact_number": "+911234567890",
  "alternate_contact_number": "+919876543210",
  "highest_qualification": "M.Tech",
  "status": true,
  "school_id": 1,
  "start_date": "2023-01-01",
  "end_date": "2024-12-31",
  "standard_subjects": [
    {
      "schoolStandardId": 1,
      "subjectIds": [1, 2]
    },
    {
      "schoolStandardId": 2,
      "subjectIds": [3, 4]
    }
  ]
}
```

#### Response

```json
{
  "id": 1,
  "name": "John Teacher",
  "email_id": "john.teacher@example.com",
  "contact_number": "+911234567890",
  "alternate_contact_number": "+919876543210",
  "highest_qualification": "M.Tech",
  "status": true,
  "role": "TEACHER",
  "school": "Delhi Public School",
  "assigned_standards": ["Class 1", "Class 2"],
  "message": "Teacher added successfully"
}
```

### Editing a Teacher

#### Endpoint
```
PUT /users/teacher
```

#### Authorization
- Requires JWT token
- ADMIN role required

#### Request Body

```json
{
  "id": 1,
  "name": "Updated Teacher Name",
  "email_id": "updated.teacher@example.com",
  "password": "NewPassword123!",
  "contact_number": "+911234567890",
  "alternate_contact_number": "+919876543210",
  "highest_qualification": "Ph.D",
  "status": true,
  "school_id": 2,
  "start_date": "2023-02-01",
  "end_date": "2024-12-31",
  "standard_subjects": [
    {
      "schoolStandardId": 3,
      "subjectIds": [5, 6]
    },
    {
      "schoolStandardId": 4,
      "subjectIds": [7, 8]
    }
  ]
}
```

#### Key Notes for Editing Teachers

1. **All fields except ID are optional** - You only need to provide the fields you want to update.
2. **Standard-Subject Replacement** - If standard_subjects is provided, all existing assignments will be replaced, not merged.
3. **School Changing Logic** - If changing schools, you should provide new standard_subjects that belong to the new school.
4. **Password Updates** - Only include the password field if you want to change the password.

#### Response

```json
{
  "id": 1,
  "name": "Updated Teacher Name",
  "email_id": "updated.teacher@example.com",
  "contact_number": "+911234567890",
  "alternate_contact_number": "+919876543210",
  "highest_qualification": "Ph.D",
  "status": true,
  "role": "TEACHER",
  "school": "New School",
  "assigned_standards": ["Class 3", "Class 4"],
  "message": "Teacher updated successfully"
}
```

#### Error Responses

**User not found (404 Not Found)**
```json
{
  "statusCode": 404,
  "message": "User with ID 999 not found",
  "error": "Not Found"
}
```

**Not a teacher (400 Bad Request)**
```json
{
  "statusCode": 400,
  "message": "User with ID 1 is not a teacher",
  "error": "Bad Request"
}
```

**Email already exists (409 Conflict)**
```json
{
  "statusCode": 409,
  "message": "User with email updated.teacher@example.com already exists",
  "error": "Conflict"
}
```

## Key Notes for Frontend Developers

1. **School Standard ID** - This is the ID from the `School_Standard` table, which represents a standard associated with a specific school, NOT the standard ID itself.

2. **Multiple Instruction Mediums** - The API automatically handles creating teacher-subject assignments for all available instruction mediums in the school, so there's no need to specify instruction mediums in the request.

3. **Example Workflow**:
   - First, select a school (`school_id`)
   - Based on the selected school, fetch available school-standards
   - For each school-standard, fetch available subjects
   - Create standard-subject assignments by combining school-standards and subjects

## Implementation Details

### Medium-Standard-Subject Connections

The system automatically links teachers to subjects across multiple instruction mediums. Here's how it works:

1. When you provide a school_id, the system identifies all instruction mediums available at that school.
2. When you provide a school_standard_id and subject_ids, the system looks for valid medium_standard_subject combinations that match:
   - The instruction mediums available at the school
   - The standard associated with the school_standard
   - Each of the provided subject IDs

3. For every valid combination found, a teacher_subject entry is created.

This means that if a school supports multiple instruction mediums (e.g., English and Hindi), and both mediums are available for a given standard-subject combination, the teacher will be assigned to teach that subject in both mediums automatically.

### Data Consistency

All operations (creating/updating the user, assigning roles, school, and subjects) are wrapped in a single database transaction. This ensures data consistency - either all operations succeed, or none do. This prevents partial user creation/updates that could leave the system in an inconsistent state. 