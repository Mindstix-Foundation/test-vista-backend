# Backend API Endpoints - Actual Implementation

## GET Endpoints

### App Controller
- GET /

### Auth Controller  
- GET /auth/profile

### Address Controller
- GET /addresses
- GET /addresses/:id

### Board Controller
- GET /boards
- GET /boards/:id

### Board Management Controller
- GET /board-management
- GET /board-management/:id

### Chapter Controller
- GET /chapters
- GET /chapters/checkQuestionType
- GET /chapters/:id

### Chapter Marks Distribution Controller
- GET /chapter-marks-distribution/distribute
- GET /chapter-marks-distribution/change-question

### Chapter Marks Range Controller (Test Paper)
- GET /test-paper/chapters/marks/range

### City Controller
- GET /cities
- GET /cities/:id

### Country Controller
- GET /countries
- GET /countries/:id

### Create Test Paper Controller
- GET /test-paper/allocation
- GET /test-paper/chapters-marks

### Image Controller
- GET /images/:id
- GET /images/presigned/:id

### Instruction Medium Controller
- GET /instruction-mediums
- GET /instruction-mediums/:id
- GET /instruction-mediums/board/:boardId

### MCQ Option Controller
- GET /mcq-options
- GET /mcq-options/:id

### Medium Standard Subject Controller
- GET /medium-standard-subjects
- GET /medium-standard-subjects/check-mediums
- GET /medium-standard-subjects/medium/:mediumId/standard/:standardId
- GET /medium-standard-subjects/:id

### Pattern Controller
- GET /patterns
- GET /patterns/:id

### Pattern Filter Controller
- GET /pattern-filter
- GET /pattern-filter/unique-marks

### Question Controller
- GET /questions
- GET /questions/count
- GET /questions/untranslated/:mediumId
- GET /questions/untranslated/:mediumId/count
- GET /questions/:id
- GET /questions/:id/topic/:topicId/verified-texts
- GET /questions/diagnostic/:id
- GET /questions/diagnostic

### Question Text Controller
- GET /question-texts
- GET /question-texts/:id
- GET /question-texts/untranslated/:mediumId

### Question Text Topic Medium Controller
- GET /question-text-topic-medium
- GET /question-text-topic-medium/:id

### Question Topic Controller
- GET /question-topics
- GET /question-topics/:id

### Question Type Controller
- GET /question-types
- GET /question-types/:id

### Role Controller
- GET /roles
- GET /roles/:id

### School Controller
- GET /schools
- GET /schools/:id

### School Instruction Medium Controller
- GET /school-instruction-mediums
- GET /school-instruction-mediums/school/:schoolId

### School Standard Controller
- GET /school-standards
- GET /school-standards/school/:schoolId

### Section Controller
- GET /sections
- GET /sections/:id

### Standard Controller
- GET /standards
- GET /standards/common-standards
- GET /standards/board/:boardId
- GET /standards/:id

### State Controller
- GET /states
- GET /states/:id

### Subject Controller
- GET /subjects
- GET /subjects/unconnected
- GET /subjects/school-standard
- GET /subjects/board/:boardId
- GET /subjects/common-subjects
- GET /subjects/:id

### Subsection Question Type Controller
- GET /subsection-question-types
- GET /subsection-question-types/:id

### Teacher Subject Controller
- GET /teacher-subjects
- GET /teacher-subjects/:id

### Test Paper HTML Controller
- GET /test-paper-html
- GET /test-paper-html/:id

### Topic Controller
- GET /topics
- GET /topics/:id

### User Controller
- GET /users
- GET /users/:id
- GET /users/check-email/:email

### User Role Controller
- GET /user-roles
- GET /user-roles/user/:userId

### User School Controller
- GET /user-schools
- GET /user-schools/user/:userId

## POST Endpoints

### Address Controller
- POST /addresses

### Auth Controller
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/change-password

### Board Controller
- POST /boards

### Board Management Controller
- POST /board-management

### Chapter Controller
- POST /chapters

### Chapter Marks Distribution Controller
- POST /chapter-marks-distribution/final-questions-distribution

### Image Controller
- POST /images
- POST /images/upload
- POST /images/upload-and-create

### Instruction Medium Controller
- POST /instruction-mediums

### MCQ Option Controller
- POST /mcq-options

### Medium Standard Subject Controller
- POST /medium-standard-subjects

### Pattern Controller
- POST /patterns

### Question Controller
- POST /questions
- POST /questions/add
- POST /questions/:id/translate
- POST /questions/assign-default-topics

### Question Text Controller
- POST /question-texts

### Question Text Topic Medium Controller
- POST /question-text-topic-medium

### Question Topic Controller
- POST /question-topics

### Question Type Controller
- POST /question-types

### School Controller
- POST /schools
- POST /schools/upsert

### School Instruction Medium Controller
- POST /school-instruction-mediums

### School Standard Controller
- POST /school-standards

### Section Controller
- POST /sections

### Standard Controller
- POST /standards

### Subject Controller
- POST /subjects

### Subsection Question Type Controller
- POST /subsection-question-types

### Teacher Subject Controller
- POST /teacher-subjects

### Test Paper HTML Controller
- POST /test-paper-html/create

### Topic Controller
- POST /topics

### User Controller
- POST /users
- POST /users/teacher

### User Role Controller
- POST /user-roles

### User School Controller
- POST /user-schools

## PUT Endpoints

### Address Controller
- PUT /addresses/:id

### Board Controller
- PUT /boards/:id

### Board Management Controller
- PUT /board-management/:id

### Chapter Controller
- PUT /chapters/:id
- PUT /chapters/reorder/:chapterId

### Instruction Medium Controller
- PUT /instruction-mediums/:id

### Pattern Controller
- PUT /patterns/:id

### Question Controller
- PUT /questions/:id
- PUT /questions/edit/:id

### Question Text Controller
- PUT /question-texts/:id

### Question Text Topic Medium Controller
- PUT /question-text-topic-medium/:id

### School Controller
- PUT /schools/:id

### Section Controller
- PUT /sections/:id
- PUT /sections/:id/reorder

### Standard Controller
- PUT /standards/:id
- PUT /standards/:id/reorder

### Subject Controller
- PUT /subjects/:id

### Subsection Question Type Controller
- PUT /subsection-question-types/:id

### Topic Controller
- PUT /topics/:id
- PUT /topics/reorder/:topicId/:chapterId

### User Controller
- PUT /users/:id
- PUT /users/teachers/:id

### User School Controller
- PUT /user-schools/user/:userId/school/:schoolId
- PUT /user-schools/:id

## DELETE Endpoints

### Address Controller
- DELETE /addresses/:id

### Board Controller
- DELETE /boards/:id

### Board Management Controller
- DELETE /board-management/:id

### Chapter Controller
- DELETE /chapters/:id

### Image Controller
- DELETE /images/:id

### Instruction Medium Controller
- DELETE /instruction-mediums/:id

### MCQ Option Controller
- DELETE /mcq-options/:id

### Medium Standard Subject Controller
- DELETE /medium-standard-subjects/:id

### Pattern Controller
- DELETE /patterns/:id

### Question Controller
- DELETE /questions/:id
- DELETE /questions/:id/remove-from-chapter

### Question Text Controller
- DELETE /question-texts/:id

### Question Text Topic Medium Controller
- DELETE /question-text-topic-medium/:id

### Question Topic Controller
- DELETE /question-topics/:id

### Question Type Controller
- DELETE /question-types/:id

### School Controller
- DELETE /schools/:id

### School Instruction Medium Controller
- DELETE /school-instruction-mediums/:id

### School Standard Controller
- DELETE /school-standards/:id

### Section Controller
- DELETE /sections/:id

### Standard Controller
- DELETE /standards/:id

### Subject Controller
- DELETE /subjects/:id

### Subsection Question Type Controller
- DELETE /subsection-question-types/:id

### Teacher Subject Controller
- DELETE /teacher-subjects/:id
- DELETE /teacher-subjects/user/:userId

### Test Paper HTML Controller
- DELETE /test-paper-html/:testPaperId

### Topic Controller
- DELETE /topics/:id

### User Controller
- DELETE /users/:id

### User Role Controller
- DELETE /user-roles/user/:userId/role/:roleId

### User School Controller
- DELETE /user-schools/user/:userId/school/:schoolId

## PATCH Endpoints

### MCQ Option Controller
- PATCH /mcq-options/:id

### Question Text Topic Medium Controller
- PATCH /question-text-topic-medium/verify
- PATCH /question-text-topic-medium/batch-verification

## Summary
- **GET Endpoints:** 81 unique endpoints
- **POST Endpoints:** 33 unique endpoints  
- **PUT Endpoints:** 21 unique endpoints
- **DELETE Endpoints:** 27 unique endpoints
- **PATCH Endpoints:** 3 unique endpoints

**Total: 165 unique API endpoints** 