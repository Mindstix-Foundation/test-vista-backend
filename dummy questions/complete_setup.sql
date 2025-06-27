-- Complete Setup SQL for Test Vista Educational System
-- This file creates: 1 Board, 1 School, 2 Teachers, Standards, Subjects, and Dummy Questions

-- ============================================================================
-- 1. ROLES ALREADY EXIST - SKIPPING ROLE INSERTS
-- ============================================================================
-- Assuming roles with IDs 1, 2, 3 already exist for admin, teacher, student

-- ============================================================================
-- 2. QUESTION TYPES - USING ON CONFLICT DO NOTHING
-- ============================================================================
INSERT INTO "Question_Type" (id, type_name) VALUES 
(1, 'MCQ') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(2, 'Odd One Out') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(3, 'Complete the Correlation') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(4, 'True or False') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(5, 'Match the Pairs') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(6, 'Fill in the Blanks') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(7, 'One-Word Answer') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(8, 'Give Scientific Reasons') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(9, 'Short Answer Question') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(10, 'Complete and Identify Reaction') ON CONFLICT (id) DO NOTHING;
INSERT INTO "Question_Type" (id, type_name) VALUES 
(11, 'Short Note') ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. INSERT ADDRESS FOR BOARD AND SCHOOL
-- ============================================================================
-- Address for Board (using Mumbai, Maharashtra, India)
INSERT INTO "Address" (id, city_id, postal_code, street, created_at, updated_at) 
VALUES (50001, 1, '400001', 'Board Head Office, Fort Area', NOW(), NOW());

-- Address for School (using Pune, Maharashtra, India)  
INSERT INTO "Address" (id, city_id, postal_code, street, created_at, updated_at) 
VALUES (50002, 2, '411001', 'School Campus, Shivaji Nagar', NOW(), NOW());

-- ============================================================================
-- 4. INSERT BOARD
-- ============================================================================
INSERT INTO "Board" (id, name, abbreviation, address_id, created_at, updated_at) 
VALUES (50001, 'Demo Maharashtra State Board - Test Vista', 'DEMO-MSBSHSE', 50001, NOW(), NOW());

-- ============================================================================
-- 5. INSERT INSTRUCTION MEDIUM
-- ============================================================================
INSERT INTO "Instruction_Medium" (id, board_id, instruction_medium, created_at, updated_at) 
VALUES (50001, 50001, 'English', NOW(), NOW());

INSERT INTO "Instruction_Medium" (id, board_id, instruction_medium, created_at, updated_at) 
VALUES (50002, 50001, 'Marathi', NOW(), NOW());

-- ============================================================================
-- 6. INSERT STANDARDS (Class 10th and 12th)
-- ============================================================================
INSERT INTO "Standard" (id, board_id, name, sequence_number, created_at, updated_at) 
VALUES (50001, 50001, 'Class 10th', 10, NOW(), NOW());

INSERT INTO "Standard" (id, board_id, name, sequence_number, created_at, updated_at) 
VALUES (50002, 50001, 'Class 12th', 12, NOW(), NOW());

-- ============================================================================
-- 7. INSERT SUBJECTS
-- ============================================================================
INSERT INTO "Subject" (id, board_id, name, created_at, updated_at) 
VALUES (50001, 50001, 'Mathematics', NOW(), NOW());

INSERT INTO "Subject" (id, board_id, name, created_at, updated_at) 
VALUES (50002, 50001, 'Science', NOW(), NOW());

INSERT INTO "Subject" (id, board_id, name, created_at, updated_at) 
VALUES (50003, 50001, 'English', NOW(), NOW());

INSERT INTO "Subject" (id, board_id, name, created_at, updated_at) 
VALUES (50004, 50001, 'Physics', NOW(), NOW());

INSERT INTO "Subject" (id, board_id, name, created_at, updated_at) 
VALUES (50005, 50001, 'Chemistry', NOW(), NOW());

-- ============================================================================
-- 8. INSERT MEDIUM-STANDARD-SUBJECT RELATIONSHIPS
-- ============================================================================
-- Mathematics for Class 10th in English
INSERT INTO "Medium_Standard_Subject" (id, instruction_medium_id, standard_id, subject_id, created_at, updated_at) 
VALUES (50001, 50001, 50001, 50001, NOW(), NOW());

-- Science for Class 10th in English
INSERT INTO "Medium_Standard_Subject" (id, instruction_medium_id, standard_id, subject_id, created_at, updated_at) 
VALUES (50002, 50001, 50001, 50002, NOW(), NOW());

-- English for Class 10th in English
INSERT INTO "Medium_Standard_Subject" (id, instruction_medium_id, standard_id, subject_id, created_at, updated_at) 
VALUES (50003, 50001, 50001, 50003, NOW(), NOW());

-- Physics for Class 12th in English
INSERT INTO "Medium_Standard_Subject" (id, instruction_medium_id, standard_id, subject_id, created_at, updated_at) 
VALUES (50004, 50001, 50002, 50004, NOW(), NOW());

-- Chemistry for Class 12th in English
INSERT INTO "Medium_Standard_Subject" (id, instruction_medium_id, standard_id, subject_id, created_at, updated_at) 
VALUES (50005, 50001, 50002, 50005, NOW(), NOW());

-- Mathematics for Class 12th in English (Common subject for both teachers)
INSERT INTO "Medium_Standard_Subject" (id, instruction_medium_id, standard_id, subject_id, created_at, updated_at) 
VALUES (50006, 50001, 50002, 50001, NOW(), NOW());

-- ============================================================================
-- 9. INSERT SCHOOL
-- ============================================================================
INSERT INTO "School" (id, board_id, name, address_id, principal_name, email, contact_number, alternate_contact_number, created_at, updated_at) 
VALUES (50001, 50001, 'Demo Shree Vidya Mandir High School - Test Vista', 50002, 'Dr. Rajesh Sharma', 'principal@demo-vidyamandir.edu.in', '+91-9876543210', '+91-9876543211', NOW(), NOW());

-- ============================================================================
-- 10. INSERT SCHOOL-INSTRUCTION MEDIUM RELATIONSHIP
-- ============================================================================
INSERT INTO "School_Instruction_Medium" (id, instruction_medium_id, school_id, created_at, updated_at) 
VALUES (50001, 50001, 50001, NOW(), NOW());

-- ============================================================================
-- 11. INSERT SCHOOL-STANDARD RELATIONSHIPS
-- ============================================================================
INSERT INTO "School_Standard" (id, standard_id, school_id, created_at, updated_at) 
VALUES (50001, 50001, 50001, NOW(), NOW());

INSERT INTO "School_Standard" (id, standard_id, school_id, created_at, updated_at) 
VALUES (50002, 50002, 50001, NOW(), NOW());

-- ============================================================================
-- 12. INSERT TEACHERS (USERS)
-- ============================================================================
-- Teacher 1: Mathematics and Science Teacher
INSERT INTO "User" (id, email_id, password, name, contact_number, alternate_contact_number, highest_qualification, status, created_at, updated_at) 
VALUES (50001, 'priya.math@vidyamandir.edu.in', '$2b$10$example.hash.for.password123', 'Prof. Priya Patel', '+91-9123456789', '+91-9123456790', 'M.Sc. Mathematics, B.Ed.', true, NOW(), NOW());

-- Teacher 2: Physics and Chemistry Teacher  
INSERT INTO "User" (id, email_id, password, name, contact_number, alternate_contact_number, highest_qualification, status, created_at, updated_at) 
VALUES (50002, 'amit.science@vidyamandir.edu.in', '$2b$10$example.hash.for.password456', 'Dr. Amit Kumar', '+91-9234567890', '+91-9234567891', 'Ph.D. Physics, M.Ed.', true, NOW(), NOW());

-- ============================================================================
-- 13. INSERT USER ROLES (ASSIGN TEACHER ROLE)
-- ============================================================================
INSERT INTO "User_Role" (id, user_id, role_id, created_at) 
VALUES (50001, 50001, 2, NOW());

INSERT INTO "User_Role" (id, user_id, role_id, created_at) 
VALUES (50002, 50002, 2, NOW());

-- ============================================================================
-- 14. INSERT USER-SCHOOL RELATIONSHIPS
-- ============================================================================
INSERT INTO "User_School" (id, user_id, school_id, start_date, created_at) 
VALUES (50001, 50001, 50001, '2024-01-01', NOW());

INSERT INTO "User_School" (id, user_id, school_id, start_date, created_at) 
VALUES (50002, 50002, 50001, '2024-01-01', NOW());

-- ============================================================================
-- 15. INSERT TEACHER SUBJECTS
-- ============================================================================
-- Teacher 1: Mathematics (Class 10th)
INSERT INTO "Teacher_Subject" (id, user_id, subject_id, school_standard_id, created_at, updated_at) 
VALUES (50001, 50001, 50001, 50001, NOW(), NOW());

-- Teacher 1: Science (Class 10th)
INSERT INTO "Teacher_Subject" (id, user_id, subject_id, school_standard_id, created_at, updated_at) 
VALUES (50002, 50001, 50002, 50001, NOW(), NOW());

-- Teacher 1: Mathematics (Class 12th) - COMMON SUBJECT
INSERT INTO "Teacher_Subject" (id, user_id, subject_id, school_standard_id, created_at, updated_at) 
VALUES (50003, 50001, 50001, 50002, NOW(), NOW());

-- Teacher 2: Physics (Class 12th)
INSERT INTO "Teacher_Subject" (id, user_id, subject_id, school_standard_id, created_at, updated_at) 
VALUES (50004, 50002, 50004, 50002, NOW(), NOW());

-- Teacher 2: Chemistry (Class 12th)
INSERT INTO "Teacher_Subject" (id, user_id, subject_id, school_standard_id, created_at, updated_at) 
VALUES (50005, 50002, 50005, 50002, NOW(), NOW());

-- Teacher 2: Mathematics (Class 12th) - COMMON SUBJECT
INSERT INTO "Teacher_Subject" (id, user_id, subject_id, school_standard_id, created_at, updated_at) 
VALUES (50006, 50002, 50001, 50002, NOW(), NOW());

-- ============================================================================
-- 16. INSERT CHAPTERS FOR MATHEMATICS (Class 12th)
-- ============================================================================
INSERT INTO "Chapter" (id, standard_id, subject_id, sequential_chapter_number, name, created_at, updated_at) 
VALUES (50001, 50002, 50001, 1, 'Relations and Functions', NOW(), NOW());

INSERT INTO "Chapter" (id, standard_id, subject_id, sequential_chapter_number, name, created_at, updated_at) 
VALUES (50002, 50002, 50001, 2, 'Inverse Trigonometric Functions', NOW(), NOW());

INSERT INTO "Chapter" (id, standard_id, subject_id, sequential_chapter_number, name, created_at, updated_at) 
VALUES (50003, 50002, 50001, 3, 'Matrices', NOW(), NOW());

INSERT INTO "Chapter" (id, standard_id, subject_id, sequential_chapter_number, name, created_at, updated_at) 
VALUES (50004, 50002, 50001, 4, 'Determinants', NOW(), NOW());

INSERT INTO "Chapter" (id, standard_id, subject_id, sequential_chapter_number, name, created_at, updated_at) 
VALUES (50005, 50002, 50001, 5, 'Continuity and Differentiability', NOW(), NOW());

-- ============================================================================
-- 17. INSERT TOPICS FOR CHAPTERS
-- ============================================================================
-- Topics for Relations and Functions
INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50001, 50001, 1, 'Types of Relations', NOW(), NOW());

INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50002, 50001, 2, 'Types of Functions', NOW(), NOW());

INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50003, 50001, 3, 'Composite Functions', NOW(), NOW());

-- Topics for Inverse Trigonometric Functions
INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50004, 50002, 1, 'Basic Concepts', NOW(), NOW());

INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50005, 50002, 2, 'Properties of Inverse Trigonometric Functions', NOW(), NOW());

-- Topics for Matrices
INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50006, 50003, 1, 'Introduction to Matrices', NOW(), NOW());

INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50007, 50003, 2, 'Operations on Matrices', NOW(), NOW());

INSERT INTO "Topic" (id, chapter_id, sequential_topic_number, name, created_at, updated_at) 
VALUES (50008, 50003, 3, 'Transpose of a Matrix', NOW(), NOW());

-- ============================================================================
-- 18. INSERT DUMMY QUESTIONS FOR MATHEMATICS (Class 12th)
-- ============================================================================

-- MCQ Questions for Relations and Functions
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52001, 1, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53001, 52001, 50001, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54001, 52001, 'Which of the following is an equivalence relation?', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55001, 54001, 53001, 50001, true, NOW(), NOW(), 'original');
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56001, 54001, 'Reflexive, Symmetric and Transitive', true, NOW(), NOW());
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56002, 54001, 'Only Reflexive', false, NOW(), NOW());
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56003, 54001, 'Only Symmetric', false, NOW(), NOW());
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56004, 54001, 'Only Transitive', false, NOW(), NOW());

INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52002, 1, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53002, 52002, 50002, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54002, 52002, 'A function f: R → R defined by f(x) = 2x + 1 is:', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55002, 54002, 53002, 50001, true, NOW(), NOW(), 'original');
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56005, 54002, 'One-one and onto', true, NOW(), NOW());
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56006, 54002, 'One-one but not onto', false, NOW(), NOW());
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56007, 54002, 'Onto but not one-one', false, NOW(), NOW());
INSERT INTO "Mcq_Option" (id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (56008, 54002, 'Neither one-one nor onto', false, NOW(), NOW());

-- True/False Questions
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52003, 4, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53003, 52003, 50006, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54003, 52003, 'Matrix multiplication is commutative. (True/False)', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55003, 54003, 53003, 50001, true, NOW(), NOW(), 'original');

INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52004, 4, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53004, 52004, 50004, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54004, 52004, 'The range of sin⁻¹x is [-π/2, π/2]. (True/False)', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55004, 54004, 53004, 50001, true, NOW(), NOW(), 'original');

-- Fill in the Blanks Questions
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52005, 6, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53005, 52005, 50007, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54005, 52005, 'If A is a 3×2 matrix and B is a 2×4 matrix, then AB is a _____ matrix.', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55005, 54005, 53005, 50001, true, NOW(), NOW(), 'original');

-- Short Answer Questions
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52006, 9, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53006, 52006, 50008, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54006, 52006, 'Define transpose of a matrix and give an example.', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55006, 54006, 53006, 50001, true, NOW(), NOW(), 'original');

INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52007, 9, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53007, 52007, 50003, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54007, 52007, 'Explain composite functions with an example.', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55007, 54007, 53007, 50001, true, NOW(), NOW(), 'original');

-- Match the Pairs Questions
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52008, 5, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53008, 52008, 50005, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54008, 52008, 'Match the following inverse trigonometric functions with their ranges:', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55008, 54008, 53008, 50001, true, NOW(), NOW(), 'original');
INSERT INTO "Match_Pair" (id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (57001, 54008, 'sin⁻¹x', '[-π/2, π/2]', NOW(), NOW());
INSERT INTO "Match_Pair" (id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (57002, 54008, 'cos⁻¹x', '[0, π]', NOW(), NOW());
INSERT INTO "Match_Pair" (id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (57003, 54008, 'tan⁻¹x', '(-π/2, π/2)', NOW(), NOW());

-- One Word Answer Questions
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52009, 7, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53009, 52009, 50006, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54009, 52009, 'What is the order of a matrix with 3 rows and 4 columns?', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55009, 54009, 53009, 50001, true, NOW(), NOW(), 'original');

INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (52010, 7, false, NOW(), NOW());
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (53010, 52010, 50001, NOW(), NOW());
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (54010, 52010, 'Name the relation that is reflexive, symmetric and transitive.', NOW(), NOW());
INSERT INTO "Question_Text_Topic_Medium" (id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (55010, 54010, 53010, 50001, true, NOW(), NOW(), 'original');

-- ============================================================================
-- END OF SETUP
-- ============================================================================

-- Summary of what was created:
-- - 1 Board: Demo Maharashtra State Board - Test Vista
-- - 1 School: Demo Shree Vidya Mandir High School - Test Vista  
-- - 2 Teachers: Prof. Priya Patel (Math/Science) and Dr. Amit Kumar (Physics/Chemistry)
-- - Common Subject: Mathematics (Class 12th) - both teachers can teach this
-- - 5 Chapters with 8 Topics for Mathematics
-- - 10 Dummy Questions of various types (MCQ, True/False, Fill in blanks, Short answer, Match pairs, One word)
-- - All necessary relationships and constraints maintained 