# Extra Endpoints in Backend_API_Endpoints_Actual.md

These endpoints are present in `Backend_API_Endpoints_Actual.md` but missing from `API_Endpoints_List.md`.

## GET Endpoints

### App Controller
- GET /

### Address Controller
- GET /addresses
- GET /addresses/:id

### Chapter Controller
- GET /chapters/checkQuestionType

### Chapter Marks Distribution Controller
- GET /chapter-marks-distribution/distribute

### Create Test Paper Controller
- GET /test-paper/chapters-marks

### MCQ Option Controller
- GET /mcq-options
- GET /mcq-options/:id

### Medium Standard Subject Controller
- GET /medium-standard-subjects/check-mediums
- GET /medium-standard-subjects/:id

### Question Controller
- GET /questions/untranslated/:mediumId/count
- GET /questions/diagnostic/:id
- GET /questions/diagnostic

### Question Text Controller
- GET /question-texts
- GET /question-texts/:id
- GET /question-texts/untranslated/:mediumId

### Question Text Topic Medium Controller
- GET /question-text-topic-medium/:id

### Question Topic Controller
- GET /question-topics
- GET /question-topics/:id

### Question Type Controller
- GET /question-types/:id

### Role Controller
- GET /roles/:id

### Section Controller
- GET /sections

### Subject Controller
- GET /subjects/unconnected
- GET /subjects/school-standard

### Teacher Subject Controller
- GET /teacher-subjects
- GET /teacher-subjects/:id

### User Controller
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

### Board Controller
- POST /boards

### Image Controller
- POST /images
- POST /images/upload-and-create

### Instruction Medium Controller
- POST /instruction-mediums

### MCQ Option Controller
- POST /mcq-options

### Question Controller
- POST /questions
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

### Standard Controller
- POST /standards

### Subject Controller
- POST /subjects

### Teacher Subject Controller
- POST /teacher-subjects

### User Controller
- POST /users

### User Role Controller
- POST /user-roles

### User School Controller
- POST /user-schools

## PUT Endpoints

### Instruction Medium Controller
- PUT /instruction-mediums/:id

### Question Controller
- PUT /questions/:id

### Question Text Controller
- PUT /question-texts/:id

### Question Text Topic Medium Controller
- PUT /question-text-topic-medium/:id

### Section Controller
- PUT /sections/:id/reorder

### Standard Controller
- PUT /standards/:id
- PUT /standards/:id/reorder

### Subject Controller
- PUT /subjects/:id

### Subsection Question Type Controller
- PUT /subsection-question-types/:id

### User School Controller
- PUT /user-schools/user/:userId/school/:schoolId
- PUT /user-schools/:id

## DELETE Endpoints

### Address Controller
- DELETE /addresses/:id

### Board Controller
- DELETE /boards/:id

### Instruction Medium Controller
- DELETE /instruction-mediums/:id

### MCQ Option Controller
- DELETE /mcq-options/:id

### Question Controller
- DELETE /questions/:id
- DELETE /questions/:id/remove-from-chapter

### Question Topic Controller
- DELETE /question-topics/:id

### Question Type Controller
- DELETE /question-types/:id

### Standard Controller
- DELETE /standards/:id

### Subject Controller
- DELETE /subjects/:id

### Teacher Subject Controller
- DELETE /teacher-subjects/:id
- DELETE /teacher-subjects/user/:userId

### User Role Controller
- DELETE /user-roles/user/:userId/role/:roleId

### User School Controller
- DELETE /user-schools/user/:userId/school/:schoolId

## PATCH Endpoints

### Question Text Topic Medium Controller
- PATCH /question-text-topic-medium/batch-verify

## Summary
- **GET Endpoints:** 29 extra endpoints
- **POST Endpoints:** 20 extra endpoints
- **PUT Endpoints:** 12 extra endpoints
- **DELETE Endpoints:** 13 extra endpoints
- **PATCH Endpoints:** 1 extra endpoint

**Total: 75 extra endpoints in Backend_API_Endpoints_Actual.md** 