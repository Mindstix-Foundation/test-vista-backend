-- Basic Setup Data for Test Vista Application
-- This file contains essential data needed for the application to function

-- Insert Roles
INSERT INTO "Role" (role_name) 
VALUES 
('ADMIN'),
('TEACHER'),
('STUDENT')
ON CONFLICT (role_name) DO NOTHING;

-- Insert Admin User
INSERT INTO "User" (email_id, password, name, contact_number, alternate_contact_number, highest_qualification, status, created_at, updated_at)
VALUES 
('udunarsale@gmail.com', 'Mind@123', 'Udu Dada', '+911234567890', '+919876543210', 'M.Tech', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email_id) DO NOTHING;

-- Assign Admin Role to User
INSERT INTO "User_Role" (user_id, role_id, created_at) 
VALUES (1, 1, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert Question Types
INSERT INTO "Question_Type" (type_name) VALUES
('Multiple Choice Question (MCQ)'),
('Odd One Out'),
('Complete the Correlation'),
('True or False'),
('Match the Pairs'),
('Fill in the Blanks'),
('One-Word Answer'),
('Give Scientific Reasons'),
('Short Answer Question'),
('Complete and Identify Reaction'),
('Short Note')
ON CONFLICT DO NOTHING;

-- Insert Sample Student User (for testing the JWT token issue)
INSERT INTO "User" (email_id, password, name, contact_number, status, created_at, updated_at)
VALUES 
('n@gmail.com', 'password123', 'Test Student', '+919999999999', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email_id) DO NOTHING;

-- Get the user ID for the student (this will be 2 if admin is 1, but could be 3 if there were other users)
-- Assign Student Role
INSERT INTO "User_Role" (user_id, role_id, created_at) 
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM "User" u, "Role" r 
WHERE u.email_id = 'n@gmail.com' AND r.role_name = 'STUDENT'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert Basic Geographic Data (required for schools)
INSERT INTO "Country" (name) VALUES ('India') ON CONFLICT DO NOTHING;

INSERT INTO "State" (country_id, name) 
SELECT c.id, 'Maharashtra' 
FROM "Country" c 
WHERE c.name = 'India'
ON CONFLICT DO NOTHING;

INSERT INTO "City" (state_id, name) 
SELECT s.id, 'Pune' 
FROM "State" s 
JOIN "Country" c ON s.country_id = c.id
WHERE s.name = 'Maharashtra' AND c.name = 'India'
ON CONFLICT DO NOTHING;

-- Insert Sample Address
INSERT INTO "Address" (city_id, postal_code, street, created_at, updated_at)
SELECT c.id, '411001', 'Sample Street, Pune', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "City" c 
JOIN "State" s ON c.state_id = s.id
JOIN "Country" co ON s.country_id = co.id
WHERE c.name = 'Pune' AND s.name = 'Maharashtra' AND co.name = 'India'
ON CONFLICT DO NOTHING;

-- Insert Sample Board
INSERT INTO "Board" (name, abbreviation, address_id, created_at, updated_at)
SELECT 'Maharashtra State Board of Secondary and Higher Secondary Education', 'MSBSHSE', a.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Address" a
JOIN "City" c ON a.city_id = c.id
WHERE c.name = 'Pune'
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Standards
INSERT INTO "Standard" (board_id, name, sequence_number, created_at, updated_at)
SELECT b.id, 'Class 10', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
WHERE b.abbreviation = 'MSBSHSE'
ON CONFLICT (board_id, name) DO NOTHING;

INSERT INTO "Standard" (board_id, name, sequence_number, created_at, updated_at)
SELECT b.id, 'Class 12', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
WHERE b.abbreviation = 'MSBSHSE'
ON CONFLICT (board_id, name) DO NOTHING;

-- Insert Sample Subjects
INSERT INTO "Subject" (board_id, name, created_at, updated_at)
SELECT b.id, 'Science', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
WHERE b.abbreviation = 'MSBSHSE'
ON CONFLICT (board_id, name) DO NOTHING;

INSERT INTO "Subject" (board_id, name, created_at, updated_at)
SELECT b.id, 'Mathematics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
WHERE b.abbreviation = 'MSBSHSE'
ON CONFLICT (board_id, name) DO NOTHING;

-- Insert Sample Instruction Medium
INSERT INTO "Instruction_Medium" (board_id, instruction_medium, created_at, updated_at)
SELECT b.id, 'English', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
WHERE b.abbreviation = 'MSBSHSE'
ON CONFLICT (board_id, instruction_medium) DO NOTHING;

INSERT INTO "Instruction_Medium" (board_id, instruction_medium, created_at, updated_at)
SELECT b.id, 'Marathi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
WHERE b.abbreviation = 'MSBSHSE'
ON CONFLICT (board_id, instruction_medium) DO NOTHING;

-- Note: You may need to run additional setup for schools, chapters, topics, etc.
-- depending on your application's requirements.

-- Success message
SELECT 'Basic setup data inserted successfully!' as message; 