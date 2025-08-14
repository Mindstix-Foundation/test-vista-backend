# Student Registration Feature

## Overview
A comprehensive student registration form that allows new students to register for the Test Vista platform. The form is accessible from the login page and includes validation, API integration, and responsive design.

## Features

### Form Fields
- **Personal Information**
  - Full Name (required)
  - Email Address (required)
  - Password (required, minimum 6 characters)
  - Confirm Password (required, must match password)
  - Contact Number (required, 10 digits starting with 6-9)
  - Alternate Contact Number (optional, must be different from primary)
  - Date of Birth (optional)
  - Student ID (required)

- **Academic Information**
  - Board (required, searchable dropdown)
  - School (required, filtered by selected board)
  - Standard (required, filtered by selected school)

### Validation
- Real-time validation with visual feedback
- Email format validation
- Phone number validation (Indian format)
- Password strength requirements
- Confirm password matching
- Required field validation
- Duplicate contact number prevention

### API Integration
- **Boards API**: `GET /boards` - Fetches all available boards
- **Schools API**: `GET /schools?boardId={id}` - Fetches schools for selected board
- **Standards API**: `GET /school-standards/school/{schoolId}` - Fetches standards for selected school
- **Registration API**: `POST /students/register` - Submits registration data

### User Experience
- Keyboard navigation support (Enter key to move between fields)
- Responsive design (mobile-friendly)
- Loading states during form submission
- Success/error messaging
- Auto-redirect to login page after successful registration

## File Structure

```
frontend/src/
├── views/login/
│   └── StudentRegistration.vue          # Main registration form component
├── router/index.ts                      # Updated with registration route
├── utils/validationConstants.ts         # Updated with student validation messages
└── views/login/LoginHomepage.vue        # Updated with registration button
```

## Usage

### Accessing the Form
1. Navigate to the login page
2. Click the "Student Registration" button
3. Fill out the registration form
4. Submit to create a new student account

### Navigation Flow
```
Login Page → Student Registration → [Success] → Login Page
```

## Technical Details

### Component Architecture
- Built with Vue 3 Composition API
- TypeScript for type safety
- Reactive form data and validation states
- Reusable SearchableDropdown component for board/school/standard selection

### Validation Strategy
- Touch-based validation (validates after user interaction)
- Real-time feedback with Bootstrap validation classes
- Comprehensive error messaging using validation constants

### API Data Flow
1. Load boards on component mount
2. Load schools when board is selected
3. Load standards when school is selected
4. Submit all form data on form submission

### Error Handling
- Network error handling with user-friendly messages
- Validation error display
- HTTP status code specific error messages (400, 409, etc.)

## Future Enhancements
- Email verification workflow
- Captcha integration
- Profile picture upload
- Additional academic information fields
- Bulk registration for schools 