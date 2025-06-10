INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1001, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3001, 1001, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2001, 1001, 'Dummy question 1001', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4001, 2001, 3001, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5001, 2001, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5002, 2001, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5003, 2001, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5004, 2001, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1002, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3002, 1002, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2002, 1002, 'Dummy question 1002', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4002, 2002, 3002, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5005, 2002, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5006, 2002, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5007, 2002, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5008, 2002, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1003, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3003, 1003, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2003, 1003, 'Dummy question 1003', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4003, 2003, 3003, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5009, 2003, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5010, 2003, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5011, 2003, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5012, 2003, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1004, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3004, 1004, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2004, 1004, 'Dummy question 1004', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4004, 2004, 3004, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5013, 2004, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5014, 2004, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5015, 2004, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5016, 2004, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1005, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3005, 1005, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2005, 1005, 'Dummy question 1005', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4005, 2005, 3005, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5017, 2005, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5018, 2005, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5019, 2005, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5020, 2005, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1006, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3006, 1006, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2006, 1006, 'Dummy question 1006', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4006, 2006, 3006, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1007, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3007, 1007, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2007, 1007, 'Dummy question 1007', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4007, 2007, 3007, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1008, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3008, 1008, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2008, 1008, 'Dummy question 1008', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4008, 2008, 3008, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1009, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3009, 1009, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2009, 1009, 'Dummy question 1009', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4009, 2009, 3009, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1010, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3010, 1010, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2010, 1010, 'Dummy question 1010', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4010, 2010, 3010, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1011, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3011, 1011, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2011, 1011, 'Dummy question 1011', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4011, 2011, 3011, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1012, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3012, 1012, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2012, 1012, 'Dummy question 1012', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4012, 2012, 3012, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1013, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3013, 1013, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2013, 1013, 'Dummy question 1013', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4013, 2013, 3013, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1014, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3014, 1014, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2014, 1014, 'Dummy question 1014', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4014, 2014, 3014, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1015, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3015, 1015, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2015, 1015, 'Dummy question 1015', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4015, 2015, 3015, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1016, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3016, 1016, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2016, 1016, 'Dummy question 1016', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4016, 2016, 3016, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1017, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3017, 1017, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2017, 1017, 'Dummy question 1017', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4017, 2017, 3017, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1018, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3018, 1018, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2018, 1018, 'Dummy question 1018', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4018, 2018, 3018, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1019, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3019, 1019, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2019, 1019, 'Dummy question 1019', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4019, 2019, 3019, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1020, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3020, 1020, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2020, 1020, 'Dummy question 1020', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4020, 2020, 3020, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1021, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3021, 1021, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2021, 1021, 'Dummy question 1021', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4021, 2021, 3021, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6001, 2021, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6002, 2021, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6003, 2021, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1022, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3022, 1022, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2022, 1022, 'Dummy question 1022', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4022, 2022, 3022, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6004, 2022, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6005, 2022, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6006, 2022, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1023, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3023, 1023, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2023, 1023, 'Dummy question 1023', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4023, 2023, 3023, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6007, 2023, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6008, 2023, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6009, 2023, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1024, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3024, 1024, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2024, 1024, 'Dummy question 1024', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4024, 2024, 3024, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6010, 2024, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6011, 2024, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6012, 2024, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1025, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3025, 1025, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2025, 1025, 'Dummy question 1025', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4025, 2025, 3025, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6013, 2025, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6014, 2025, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6015, 2025, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1026, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3026, 1026, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2026, 1026, 'Dummy question 1026', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4026, 2026, 3026, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1027, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3027, 1027, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2027, 1027, 'Dummy question 1027', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4027, 2027, 3027, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1028, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3028, 1028, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2028, 1028, 'Dummy question 1028', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4028, 2028, 3028, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1029, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3029, 1029, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2029, 1029, 'Dummy question 1029', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4029, 2029, 3029, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1030, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3030, 1030, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2030, 1030, 'Dummy question 1030', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4030, 2030, 3030, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1031, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3031, 1031, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2031, 1031, 'Dummy question 1031', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4031, 2031, 3031, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1032, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3032, 1032, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2032, 1032, 'Dummy question 1032', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4032, 2032, 3032, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1033, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3033, 1033, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2033, 1033, 'Dummy question 1033', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4033, 2033, 3033, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1034, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3034, 1034, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2034, 1034, 'Dummy question 1034', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4034, 2034, 3034, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1035, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3035, 1035, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2035, 1035, 'Dummy question 1035', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4035, 2035, 3035, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1036, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3036, 1036, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2036, 1036, 'Dummy question 1036', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4036, 2036, 3036, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1037, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3037, 1037, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2037, 1037, 'Dummy question 1037', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4037, 2037, 3037, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1038, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3038, 1038, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2038, 1038, 'Dummy question 1038', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4038, 2038, 3038, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1039, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3039, 1039, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2039, 1039, 'Dummy question 1039', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4039, 2039, 3039, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1040, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3040, 1040, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2040, 1040, 'Dummy question 1040', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4040, 2040, 3040, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1041, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3041, 1041, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2041, 1041, 'Dummy question 1041', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4041, 2041, 3041, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1042, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3042, 1042, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2042, 1042, 'Dummy question 1042', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4042, 2042, 3042, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1043, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3043, 1043, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2043, 1043, 'Dummy question 1043', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4043, 2043, 3043, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1044, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3044, 1044, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2044, 1044, 'Dummy question 1044', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4044, 2044, 3044, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1045, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3045, 1045, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2045, 1045, 'Dummy question 1045', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4045, 2045, 3045, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1046, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3046, 1046, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2046, 1046, 'Dummy question 1046', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4046, 2046, 3046, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1047, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3047, 1047, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2047, 1047, 'Dummy question 1047', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4047, 2047, 3047, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1048, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3048, 1048, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2048, 1048, 'Dummy question 1048', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4048, 2048, 3048, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1049, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3049, 1049, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2049, 1049, 'Dummy question 1049', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4049, 2049, 3049, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1050, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3050, 1050, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2050, 1050, 'Dummy question 1050', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4050, 2050, 3050, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1051, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3051, 1051, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2051, 1051, 'Dummy question 1051', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4051, 2051, 3051, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1052, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3052, 1052, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2052, 1052, 'Dummy question 1052', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4052, 2052, 3052, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1053, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3053, 1053, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2053, 1053, 'Dummy question 1053', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4053, 2053, 3053, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1054, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3054, 1054, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2054, 1054, 'Dummy question 1054', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4054, 2054, 3054, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1055, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3055, 1055, 1, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2055, 1055, 'Dummy question 1055', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4055, 2055, 3055, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1056, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3056, 1056, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2056, 1056, 'Dummy question 1056', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4056, 2056, 3056, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5021, 2056, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5022, 2056, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5023, 2056, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5024, 2056, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1057, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3057, 1057, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2057, 1057, 'Dummy question 1057', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4057, 2057, 3057, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5025, 2057, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5026, 2057, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5027, 2057, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5028, 2057, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1058, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3058, 1058, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2058, 1058, 'Dummy question 1058', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4058, 2058, 3058, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5029, 2058, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5030, 2058, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5031, 2058, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5032, 2058, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1059, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3059, 1059, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2059, 1059, 'Dummy question 1059', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4059, 2059, 3059, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5033, 2059, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5034, 2059, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5035, 2059, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5036, 2059, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1060, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3060, 1060, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2060, 1060, 'Dummy question 1060', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4060, 2060, 3060, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5037, 2060, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5038, 2060, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5039, 2060, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5040, 2060, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1061, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3061, 1061, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2061, 1061, 'Dummy question 1061', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4061, 2061, 3061, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1062, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3062, 1062, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2062, 1062, 'Dummy question 1062', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4062, 2062, 3062, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1063, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3063, 1063, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2063, 1063, 'Dummy question 1063', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4063, 2063, 3063, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1064, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3064, 1064, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2064, 1064, 'Dummy question 1064', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4064, 2064, 3064, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1065, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3065, 1065, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2065, 1065, 'Dummy question 1065', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4065, 2065, 3065, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1066, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3066, 1066, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2066, 1066, 'Dummy question 1066', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4066, 2066, 3066, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1067, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3067, 1067, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2067, 1067, 'Dummy question 1067', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4067, 2067, 3067, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1068, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3068, 1068, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2068, 1068, 'Dummy question 1068', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4068, 2068, 3068, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1069, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3069, 1069, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2069, 1069, 'Dummy question 1069', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4069, 2069, 3069, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1070, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3070, 1070, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2070, 1070, 'Dummy question 1070', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4070, 2070, 3070, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1071, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3071, 1071, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2071, 1071, 'Dummy question 1071', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4071, 2071, 3071, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1072, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3072, 1072, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2072, 1072, 'Dummy question 1072', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4072, 2072, 3072, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1073, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3073, 1073, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2073, 1073, 'Dummy question 1073', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4073, 2073, 3073, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1074, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3074, 1074, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2074, 1074, 'Dummy question 1074', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4074, 2074, 3074, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1075, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3075, 1075, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2075, 1075, 'Dummy question 1075', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4075, 2075, 3075, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1076, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3076, 1076, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2076, 1076, 'Dummy question 1076', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4076, 2076, 3076, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6016, 2076, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6017, 2076, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6018, 2076, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1077, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3077, 1077, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2077, 1077, 'Dummy question 1077', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4077, 2077, 3077, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6019, 2077, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6020, 2077, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6021, 2077, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1078, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3078, 1078, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2078, 1078, 'Dummy question 1078', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4078, 2078, 3078, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6022, 2078, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6023, 2078, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6024, 2078, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1079, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3079, 1079, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2079, 1079, 'Dummy question 1079', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4079, 2079, 3079, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6025, 2079, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6026, 2079, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6027, 2079, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1080, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3080, 1080, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2080, 1080, 'Dummy question 1080', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4080, 2080, 3080, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6028, 2080, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6029, 2080, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6030, 2080, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1081, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3081, 1081, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2081, 1081, 'Dummy question 1081', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4081, 2081, 3081, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1082, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3082, 1082, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2082, 1082, 'Dummy question 1082', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4082, 2082, 3082, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1083, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3083, 1083, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2083, 1083, 'Dummy question 1083', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4083, 2083, 3083, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1084, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3084, 1084, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2084, 1084, 'Dummy question 1084', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4084, 2084, 3084, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1085, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3085, 1085, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2085, 1085, 'Dummy question 1085', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4085, 2085, 3085, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1086, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3086, 1086, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2086, 1086, 'Dummy question 1086', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4086, 2086, 3086, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1087, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3087, 1087, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2087, 1087, 'Dummy question 1087', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4087, 2087, 3087, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1088, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3088, 1088, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2088, 1088, 'Dummy question 1088', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4088, 2088, 3088, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1089, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3089, 1089, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2089, 1089, 'Dummy question 1089', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4089, 2089, 3089, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1090, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3090, 1090, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2090, 1090, 'Dummy question 1090', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4090, 2090, 3090, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1091, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3091, 1091, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2091, 1091, 'Dummy question 1091', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4091, 2091, 3091, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1092, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3092, 1092, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2092, 1092, 'Dummy question 1092', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4092, 2092, 3092, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1093, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3093, 1093, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2093, 1093, 'Dummy question 1093', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4093, 2093, 3093, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1094, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3094, 1094, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2094, 1094, 'Dummy question 1094', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4094, 2094, 3094, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1095, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3095, 1095, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2095, 1095, 'Dummy question 1095', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4095, 2095, 3095, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1096, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3096, 1096, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2096, 1096, 'Dummy question 1096', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4096, 2096, 3096, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1097, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3097, 1097, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2097, 1097, 'Dummy question 1097', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4097, 2097, 3097, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1098, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3098, 1098, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2098, 1098, 'Dummy question 1098', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4098, 2098, 3098, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1099, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3099, 1099, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2099, 1099, 'Dummy question 1099', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4099, 2099, 3099, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1100, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3100, 1100, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2100, 1100, 'Dummy question 1100', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4100, 2100, 3100, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1101, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3101, 1101, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2101, 1101, 'Dummy question 1101', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4101, 2101, 3101, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1102, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3102, 1102, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2102, 1102, 'Dummy question 1102', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4102, 2102, 3102, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1103, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3103, 1103, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2103, 1103, 'Dummy question 1103', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4103, 2103, 3103, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1104, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3104, 1104, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2104, 1104, 'Dummy question 1104', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4104, 2104, 3104, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1105, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3105, 1105, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2105, 1105, 'Dummy question 1105', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4105, 2105, 3105, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1106, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3106, 1106, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2106, 1106, 'Dummy question 1106', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4106, 2106, 3106, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1107, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3107, 1107, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2107, 1107, 'Dummy question 1107', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4107, 2107, 3107, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1108, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3108, 1108, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2108, 1108, 'Dummy question 1108', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4108, 2108, 3108, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1109, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3109, 1109, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2109, 1109, 'Dummy question 1109', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4109, 2109, 3109, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1110, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3110, 1110, 2, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2110, 1110, 'Dummy question 1110', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4110, 2110, 3110, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1111, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3111, 1111, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2111, 1111, 'Dummy question 1111', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4111, 2111, 3111, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5041, 2111, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5042, 2111, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5043, 2111, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5044, 2111, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1112, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3112, 1112, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2112, 1112, 'Dummy question 1112', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4112, 2112, 3112, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5045, 2112, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5046, 2112, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5047, 2112, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5048, 2112, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1113, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3113, 1113, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2113, 1113, 'Dummy question 1113', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4113, 2113, 3113, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5049, 2113, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5050, 2113, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5051, 2113, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5052, 2113, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1114, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3114, 1114, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2114, 1114, 'Dummy question 1114', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4114, 2114, 3114, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5053, 2114, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5054, 2114, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5055, 2114, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5056, 2114, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1115, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3115, 1115, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2115, 1115, 'Dummy question 1115', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4115, 2115, 3115, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5057, 2115, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5058, 2115, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5059, 2115, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5060, 2115, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1116, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3116, 1116, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2116, 1116, 'Dummy question 1116', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4116, 2116, 3116, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1117, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3117, 1117, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2117, 1117, 'Dummy question 1117', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4117, 2117, 3117, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1118, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3118, 1118, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2118, 1118, 'Dummy question 1118', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4118, 2118, 3118, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1119, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3119, 1119, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2119, 1119, 'Dummy question 1119', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4119, 2119, 3119, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1120, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3120, 1120, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2120, 1120, 'Dummy question 1120', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4120, 2120, 3120, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1121, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3121, 1121, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2121, 1121, 'Dummy question 1121', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4121, 2121, 3121, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1122, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3122, 1122, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2122, 1122, 'Dummy question 1122', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4122, 2122, 3122, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1123, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3123, 1123, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2123, 1123, 'Dummy question 1123', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4123, 2123, 3123, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1124, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3124, 1124, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2124, 1124, 'Dummy question 1124', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4124, 2124, 3124, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1125, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3125, 1125, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2125, 1125, 'Dummy question 1125', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4125, 2125, 3125, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1126, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3126, 1126, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2126, 1126, 'Dummy question 1126', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4126, 2126, 3126, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1127, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3127, 1127, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2127, 1127, 'Dummy question 1127', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4127, 2127, 3127, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1128, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3128, 1128, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2128, 1128, 'Dummy question 1128', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4128, 2128, 3128, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1129, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3129, 1129, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2129, 1129, 'Dummy question 1129', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4129, 2129, 3129, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1130, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3130, 1130, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2130, 1130, 'Dummy question 1130', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4130, 2130, 3130, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1131, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3131, 1131, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2131, 1131, 'Dummy question 1131', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4131, 2131, 3131, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6031, 2131, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6032, 2131, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6033, 2131, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1132, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3132, 1132, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2132, 1132, 'Dummy question 1132', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4132, 2132, 3132, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6034, 2132, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6035, 2132, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6036, 2132, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1133, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3133, 1133, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2133, 1133, 'Dummy question 1133', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4133, 2133, 3133, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6037, 2133, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6038, 2133, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6039, 2133, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1134, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3134, 1134, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2134, 1134, 'Dummy question 1134', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4134, 2134, 3134, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6040, 2134, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6041, 2134, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6042, 2134, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1135, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3135, 1135, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2135, 1135, 'Dummy question 1135', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4135, 2135, 3135, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6043, 2135, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6044, 2135, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6045, 2135, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1136, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3136, 1136, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2136, 1136, 'Dummy question 1136', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4136, 2136, 3136, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1137, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3137, 1137, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2137, 1137, 'Dummy question 1137', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4137, 2137, 3137, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1138, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3138, 1138, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2138, 1138, 'Dummy question 1138', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4138, 2138, 3138, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1139, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3139, 1139, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2139, 1139, 'Dummy question 1139', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4139, 2139, 3139, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1140, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3140, 1140, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2140, 1140, 'Dummy question 1140', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4140, 2140, 3140, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1141, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3141, 1141, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2141, 1141, 'Dummy question 1141', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4141, 2141, 3141, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1142, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3142, 1142, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2142, 1142, 'Dummy question 1142', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4142, 2142, 3142, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1143, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3143, 1143, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2143, 1143, 'Dummy question 1143', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4143, 2143, 3143, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1144, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3144, 1144, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2144, 1144, 'Dummy question 1144', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4144, 2144, 3144, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1145, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3145, 1145, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2145, 1145, 'Dummy question 1145', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4145, 2145, 3145, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1146, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3146, 1146, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2146, 1146, 'Dummy question 1146', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4146, 2146, 3146, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1147, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3147, 1147, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2147, 1147, 'Dummy question 1147', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4147, 2147, 3147, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1148, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3148, 1148, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2148, 1148, 'Dummy question 1148', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4148, 2148, 3148, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1149, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3149, 1149, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2149, 1149, 'Dummy question 1149', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4149, 2149, 3149, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1150, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3150, 1150, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2150, 1150, 'Dummy question 1150', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4150, 2150, 3150, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1151, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3151, 1151, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2151, 1151, 'Dummy question 1151', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4151, 2151, 3151, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1152, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3152, 1152, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2152, 1152, 'Dummy question 1152', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4152, 2152, 3152, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1153, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3153, 1153, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2153, 1153, 'Dummy question 1153', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4153, 2153, 3153, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1154, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3154, 1154, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2154, 1154, 'Dummy question 1154', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4154, 2154, 3154, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1155, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3155, 1155, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2155, 1155, 'Dummy question 1155', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4155, 2155, 3155, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1156, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3156, 1156, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2156, 1156, 'Dummy question 1156', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4156, 2156, 3156, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1157, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3157, 1157, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2157, 1157, 'Dummy question 1157', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4157, 2157, 3157, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1158, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3158, 1158, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2158, 1158, 'Dummy question 1158', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4158, 2158, 3158, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1159, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3159, 1159, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2159, 1159, 'Dummy question 1159', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4159, 2159, 3159, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1160, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3160, 1160, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2160, 1160, 'Dummy question 1160', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4160, 2160, 3160, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1161, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3161, 1161, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2161, 1161, 'Dummy question 1161', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4161, 2161, 3161, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1162, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3162, 1162, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2162, 1162, 'Dummy question 1162', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4162, 2162, 3162, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1163, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3163, 1163, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2163, 1163, 'Dummy question 1163', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4163, 2163, 3163, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1164, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3164, 1164, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2164, 1164, 'Dummy question 1164', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4164, 2164, 3164, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1165, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3165, 1165, 3, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2165, 1165, 'Dummy question 1165', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4165, 2165, 3165, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1166, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3166, 1166, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2166, 1166, 'Dummy question 1166', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4166, 2166, 3166, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5061, 2166, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5062, 2166, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5063, 2166, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5064, 2166, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1167, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3167, 1167, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2167, 1167, 'Dummy question 1167', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4167, 2167, 3167, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5065, 2167, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5066, 2167, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5067, 2167, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5068, 2167, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1168, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3168, 1168, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2168, 1168, 'Dummy question 1168', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4168, 2168, 3168, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5069, 2168, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5070, 2168, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5071, 2168, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5072, 2168, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1169, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3169, 1169, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2169, 1169, 'Dummy question 1169', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4169, 2169, 3169, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5073, 2169, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5074, 2169, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5075, 2169, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5076, 2169, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1170, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3170, 1170, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2170, 1170, 'Dummy question 1170', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4170, 2170, 3170, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5077, 2170, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5078, 2170, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5079, 2170, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5080, 2170, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1171, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3171, 1171, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2171, 1171, 'Dummy question 1171', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4171, 2171, 3171, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1172, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3172, 1172, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2172, 1172, 'Dummy question 1172', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4172, 2172, 3172, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1173, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3173, 1173, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2173, 1173, 'Dummy question 1173', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4173, 2173, 3173, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1174, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3174, 1174, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2174, 1174, 'Dummy question 1174', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4174, 2174, 3174, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1175, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3175, 1175, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2175, 1175, 'Dummy question 1175', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4175, 2175, 3175, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1176, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3176, 1176, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2176, 1176, 'Dummy question 1176', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4176, 2176, 3176, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1177, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3177, 1177, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2177, 1177, 'Dummy question 1177', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4177, 2177, 3177, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1178, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3178, 1178, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2178, 1178, 'Dummy question 1178', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4178, 2178, 3178, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1179, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3179, 1179, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2179, 1179, 'Dummy question 1179', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4179, 2179, 3179, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1180, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3180, 1180, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2180, 1180, 'Dummy question 1180', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4180, 2180, 3180, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1181, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3181, 1181, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2181, 1181, 'Dummy question 1181', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4181, 2181, 3181, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1182, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3182, 1182, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2182, 1182, 'Dummy question 1182', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4182, 2182, 3182, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1183, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3183, 1183, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2183, 1183, 'Dummy question 1183', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4183, 2183, 3183, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1184, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3184, 1184, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2184, 1184, 'Dummy question 1184', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4184, 2184, 3184, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1185, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3185, 1185, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2185, 1185, 'Dummy question 1185', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4185, 2185, 3185, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1186, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3186, 1186, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2186, 1186, 'Dummy question 1186', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4186, 2186, 3186, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6046, 2186, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6047, 2186, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6048, 2186, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1187, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3187, 1187, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2187, 1187, 'Dummy question 1187', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4187, 2187, 3187, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6049, 2187, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6050, 2187, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6051, 2187, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1188, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3188, 1188, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2188, 1188, 'Dummy question 1188', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4188, 2188, 3188, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6052, 2188, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6053, 2188, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6054, 2188, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1189, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3189, 1189, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2189, 1189, 'Dummy question 1189', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4189, 2189, 3189, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6055, 2189, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6056, 2189, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6057, 2189, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1190, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3190, 1190, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2190, 1190, 'Dummy question 1190', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4190, 2190, 3190, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6058, 2190, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6059, 2190, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6060, 2190, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1191, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3191, 1191, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2191, 1191, 'Dummy question 1191', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4191, 2191, 3191, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1192, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3192, 1192, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2192, 1192, 'Dummy question 1192', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4192, 2192, 3192, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1193, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3193, 1193, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2193, 1193, 'Dummy question 1193', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4193, 2193, 3193, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1194, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3194, 1194, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2194, 1194, 'Dummy question 1194', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4194, 2194, 3194, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1195, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3195, 1195, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2195, 1195, 'Dummy question 1195', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4195, 2195, 3195, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1196, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3196, 1196, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2196, 1196, 'Dummy question 1196', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4196, 2196, 3196, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1197, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3197, 1197, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2197, 1197, 'Dummy question 1197', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4197, 2197, 3197, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1198, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3198, 1198, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2198, 1198, 'Dummy question 1198', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4198, 2198, 3198, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1199, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3199, 1199, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2199, 1199, 'Dummy question 1199', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4199, 2199, 3199, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1200, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3200, 1200, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2200, 1200, 'Dummy question 1200', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4200, 2200, 3200, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1201, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3201, 1201, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2201, 1201, 'Dummy question 1201', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4201, 2201, 3201, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1202, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3202, 1202, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2202, 1202, 'Dummy question 1202', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4202, 2202, 3202, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1203, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3203, 1203, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2203, 1203, 'Dummy question 1203', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4203, 2203, 3203, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1204, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3204, 1204, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2204, 1204, 'Dummy question 1204', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4204, 2204, 3204, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1205, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3205, 1205, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2205, 1205, 'Dummy question 1205', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4205, 2205, 3205, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1206, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3206, 1206, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2206, 1206, 'Dummy question 1206', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4206, 2206, 3206, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1207, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3207, 1207, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2207, 1207, 'Dummy question 1207', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4207, 2207, 3207, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1208, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3208, 1208, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2208, 1208, 'Dummy question 1208', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4208, 2208, 3208, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1209, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3209, 1209, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2209, 1209, 'Dummy question 1209', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4209, 2209, 3209, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1210, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3210, 1210, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2210, 1210, 'Dummy question 1210', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4210, 2210, 3210, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1211, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3211, 1211, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2211, 1211, 'Dummy question 1211', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4211, 2211, 3211, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1212, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3212, 1212, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2212, 1212, 'Dummy question 1212', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4212, 2212, 3212, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1213, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3213, 1213, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2213, 1213, 'Dummy question 1213', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4213, 2213, 3213, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1214, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3214, 1214, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2214, 1214, 'Dummy question 1214', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4214, 2214, 3214, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1215, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3215, 1215, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2215, 1215, 'Dummy question 1215', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4215, 2215, 3215, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1216, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3216, 1216, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2216, 1216, 'Dummy question 1216', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4216, 2216, 3216, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1217, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3217, 1217, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2217, 1217, 'Dummy question 1217', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4217, 2217, 3217, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1218, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3218, 1218, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2218, 1218, 'Dummy question 1218', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4218, 2218, 3218, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1219, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3219, 1219, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2219, 1219, 'Dummy question 1219', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4219, 2219, 3219, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1220, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3220, 1220, 4, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2220, 1220, 'Dummy question 1220', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4220, 2220, 3220, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1221, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3221, 1221, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2221, 1221, 'Dummy question 1221', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4221, 2221, 3221, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5081, 2221, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5082, 2221, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5083, 2221, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5084, 2221, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1222, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3222, 1222, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2222, 1222, 'Dummy question 1222', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4222, 2222, 3222, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5085, 2222, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5086, 2222, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5087, 2222, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5088, 2222, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1223, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3223, 1223, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2223, 1223, 'Dummy question 1223', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4223, 2223, 3223, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5089, 2223, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5090, 2223, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5091, 2223, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5092, 2223, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1224, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3224, 1224, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2224, 1224, 'Dummy question 1224', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4224, 2224, 3224, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5093, 2224, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5094, 2224, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5095, 2224, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5096, 2224, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1225, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3225, 1225, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2225, 1225, 'Dummy question 1225', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4225, 2225, 3225, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5097, 2225, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5098, 2225, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5099, 2225, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5100, 2225, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1226, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3226, 1226, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2226, 1226, 'Dummy question 1226', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4226, 2226, 3226, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1227, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3227, 1227, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2227, 1227, 'Dummy question 1227', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4227, 2227, 3227, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1228, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3228, 1228, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2228, 1228, 'Dummy question 1228', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4228, 2228, 3228, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1229, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3229, 1229, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2229, 1229, 'Dummy question 1229', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4229, 2229, 3229, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1230, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3230, 1230, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2230, 1230, 'Dummy question 1230', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4230, 2230, 3230, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1231, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3231, 1231, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2231, 1231, 'Dummy question 1231', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4231, 2231, 3231, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1232, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3232, 1232, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2232, 1232, 'Dummy question 1232', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4232, 2232, 3232, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1233, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3233, 1233, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2233, 1233, 'Dummy question 1233', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4233, 2233, 3233, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1234, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3234, 1234, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2234, 1234, 'Dummy question 1234', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4234, 2234, 3234, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1235, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3235, 1235, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2235, 1235, 'Dummy question 1235', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4235, 2235, 3235, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1236, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3236, 1236, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2236, 1236, 'Dummy question 1236', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4236, 2236, 3236, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1237, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3237, 1237, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2237, 1237, 'Dummy question 1237', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4237, 2237, 3237, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1238, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3238, 1238, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2238, 1238, 'Dummy question 1238', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4238, 2238, 3238, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1239, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3239, 1239, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2239, 1239, 'Dummy question 1239', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4239, 2239, 3239, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1240, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3240, 1240, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2240, 1240, 'Dummy question 1240', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4240, 2240, 3240, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1241, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3241, 1241, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2241, 1241, 'Dummy question 1241', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4241, 2241, 3241, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6061, 2241, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6062, 2241, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6063, 2241, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1242, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3242, 1242, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2242, 1242, 'Dummy question 1242', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4242, 2242, 3242, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6064, 2242, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6065, 2242, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6066, 2242, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1243, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3243, 1243, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2243, 1243, 'Dummy question 1243', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4243, 2243, 3243, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6067, 2243, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6068, 2243, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6069, 2243, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1244, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3244, 1244, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2244, 1244, 'Dummy question 1244', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4244, 2244, 3244, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6070, 2244, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6071, 2244, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6072, 2244, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1245, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3245, 1245, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2245, 1245, 'Dummy question 1245', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4245, 2245, 3245, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6073, 2245, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6074, 2245, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6075, 2245, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1246, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3246, 1246, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2246, 1246, 'Dummy question 1246', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4246, 2246, 3246, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1247, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3247, 1247, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2247, 1247, 'Dummy question 1247', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4247, 2247, 3247, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1248, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3248, 1248, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2248, 1248, 'Dummy question 1248', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4248, 2248, 3248, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1249, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3249, 1249, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2249, 1249, 'Dummy question 1249', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4249, 2249, 3249, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1250, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3250, 1250, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2250, 1250, 'Dummy question 1250', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4250, 2250, 3250, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1251, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3251, 1251, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2251, 1251, 'Dummy question 1251', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4251, 2251, 3251, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1252, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3252, 1252, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2252, 1252, 'Dummy question 1252', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4252, 2252, 3252, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1253, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3253, 1253, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2253, 1253, 'Dummy question 1253', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4253, 2253, 3253, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1254, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3254, 1254, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2254, 1254, 'Dummy question 1254', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4254, 2254, 3254, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1255, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3255, 1255, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2255, 1255, 'Dummy question 1255', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4255, 2255, 3255, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1256, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3256, 1256, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2256, 1256, 'Dummy question 1256', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4256, 2256, 3256, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1257, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3257, 1257, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2257, 1257, 'Dummy question 1257', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4257, 2257, 3257, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1258, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3258, 1258, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2258, 1258, 'Dummy question 1258', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4258, 2258, 3258, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1259, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3259, 1259, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2259, 1259, 'Dummy question 1259', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4259, 2259, 3259, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1260, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3260, 1260, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2260, 1260, 'Dummy question 1260', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4260, 2260, 3260, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1261, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3261, 1261, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2261, 1261, 'Dummy question 1261', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4261, 2261, 3261, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1262, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3262, 1262, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2262, 1262, 'Dummy question 1262', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4262, 2262, 3262, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1263, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3263, 1263, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2263, 1263, 'Dummy question 1263', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4263, 2263, 3263, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1264, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3264, 1264, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2264, 1264, 'Dummy question 1264', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4264, 2264, 3264, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1265, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3265, 1265, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2265, 1265, 'Dummy question 1265', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4265, 2265, 3265, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1266, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3266, 1266, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2266, 1266, 'Dummy question 1266', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4266, 2266, 3266, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1267, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3267, 1267, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2267, 1267, 'Dummy question 1267', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4267, 2267, 3267, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1268, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3268, 1268, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2268, 1268, 'Dummy question 1268', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4268, 2268, 3268, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1269, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3269, 1269, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2269, 1269, 'Dummy question 1269', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4269, 2269, 3269, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1270, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3270, 1270, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2270, 1270, 'Dummy question 1270', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4270, 2270, 3270, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1271, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3271, 1271, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2271, 1271, 'Dummy question 1271', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4271, 2271, 3271, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1272, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3272, 1272, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2272, 1272, 'Dummy question 1272', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4272, 2272, 3272, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1273, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3273, 1273, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2273, 1273, 'Dummy question 1273', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4273, 2273, 3273, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1274, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3274, 1274, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2274, 1274, 'Dummy question 1274', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4274, 2274, 3274, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1275, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3275, 1275, 5, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2275, 1275, 'Dummy question 1275', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4275, 2275, 3275, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1276, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3276, 1276, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2276, 1276, 'Dummy question 1276', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4276, 2276, 3276, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5101, 2276, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5102, 2276, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5103, 2276, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5104, 2276, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1277, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3277, 1277, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2277, 1277, 'Dummy question 1277', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4277, 2277, 3277, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5105, 2277, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5106, 2277, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5107, 2277, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5108, 2277, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1278, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3278, 1278, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2278, 1278, 'Dummy question 1278', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4278, 2278, 3278, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5109, 2278, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5110, 2278, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5111, 2278, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5112, 2278, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1279, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3279, 1279, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2279, 1279, 'Dummy question 1279', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4279, 2279, 3279, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5113, 2279, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5114, 2279, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5115, 2279, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5116, 2279, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1280, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3280, 1280, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2280, 1280, 'Dummy question 1280', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4280, 2280, 3280, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5117, 2280, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5118, 2280, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5119, 2280, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5120, 2280, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1281, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3281, 1281, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2281, 1281, 'Dummy question 1281', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4281, 2281, 3281, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1282, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3282, 1282, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2282, 1282, 'Dummy question 1282', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4282, 2282, 3282, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1283, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3283, 1283, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2283, 1283, 'Dummy question 1283', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4283, 2283, 3283, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1284, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3284, 1284, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2284, 1284, 'Dummy question 1284', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4284, 2284, 3284, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1285, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3285, 1285, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2285, 1285, 'Dummy question 1285', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4285, 2285, 3285, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1286, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3286, 1286, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2286, 1286, 'Dummy question 1286', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4286, 2286, 3286, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1287, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3287, 1287, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2287, 1287, 'Dummy question 1287', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4287, 2287, 3287, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1288, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3288, 1288, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2288, 1288, 'Dummy question 1288', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4288, 2288, 3288, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1289, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3289, 1289, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2289, 1289, 'Dummy question 1289', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4289, 2289, 3289, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1290, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3290, 1290, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2290, 1290, 'Dummy question 1290', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4290, 2290, 3290, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1291, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3291, 1291, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2291, 1291, 'Dummy question 1291', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4291, 2291, 3291, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1292, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3292, 1292, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2292, 1292, 'Dummy question 1292', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4292, 2292, 3292, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1293, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3293, 1293, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2293, 1293, 'Dummy question 1293', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4293, 2293, 3293, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1294, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3294, 1294, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2294, 1294, 'Dummy question 1294', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4294, 2294, 3294, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1295, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3295, 1295, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2295, 1295, 'Dummy question 1295', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4295, 2295, 3295, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1296, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3296, 1296, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2296, 1296, 'Dummy question 1296', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4296, 2296, 3296, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6076, 2296, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6077, 2296, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6078, 2296, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1297, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3297, 1297, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2297, 1297, 'Dummy question 1297', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4297, 2297, 3297, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6079, 2297, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6080, 2297, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6081, 2297, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1298, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3298, 1298, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2298, 1298, 'Dummy question 1298', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4298, 2298, 3298, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6082, 2298, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6083, 2298, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6084, 2298, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1299, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3299, 1299, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2299, 1299, 'Dummy question 1299', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4299, 2299, 3299, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6085, 2299, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6086, 2299, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6087, 2299, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1300, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3300, 1300, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2300, 1300, 'Dummy question 1300', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4300, 2300, 3300, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6088, 2300, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6089, 2300, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6090, 2300, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1301, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3301, 1301, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2301, 1301, 'Dummy question 1301', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4301, 2301, 3301, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1302, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3302, 1302, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2302, 1302, 'Dummy question 1302', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4302, 2302, 3302, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1303, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3303, 1303, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2303, 1303, 'Dummy question 1303', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4303, 2303, 3303, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1304, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3304, 1304, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2304, 1304, 'Dummy question 1304', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4304, 2304, 3304, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1305, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3305, 1305, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2305, 1305, 'Dummy question 1305', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4305, 2305, 3305, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1306, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3306, 1306, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2306, 1306, 'Dummy question 1306', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4306, 2306, 3306, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1307, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3307, 1307, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2307, 1307, 'Dummy question 1307', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4307, 2307, 3307, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1308, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3308, 1308, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2308, 1308, 'Dummy question 1308', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4308, 2308, 3308, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1309, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3309, 1309, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2309, 1309, 'Dummy question 1309', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4309, 2309, 3309, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1310, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3310, 1310, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2310, 1310, 'Dummy question 1310', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4310, 2310, 3310, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1311, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3311, 1311, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2311, 1311, 'Dummy question 1311', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4311, 2311, 3311, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1312, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3312, 1312, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2312, 1312, 'Dummy question 1312', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4312, 2312, 3312, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1313, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3313, 1313, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2313, 1313, 'Dummy question 1313', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4313, 2313, 3313, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1314, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3314, 1314, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2314, 1314, 'Dummy question 1314', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4314, 2314, 3314, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1315, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3315, 1315, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2315, 1315, 'Dummy question 1315', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4315, 2315, 3315, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1316, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3316, 1316, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2316, 1316, 'Dummy question 1316', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4316, 2316, 3316, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1317, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3317, 1317, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2317, 1317, 'Dummy question 1317', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4317, 2317, 3317, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1318, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3318, 1318, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2318, 1318, 'Dummy question 1318', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4318, 2318, 3318, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1319, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3319, 1319, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2319, 1319, 'Dummy question 1319', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4319, 2319, 3319, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1320, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3320, 1320, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2320, 1320, 'Dummy question 1320', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4320, 2320, 3320, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1321, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3321, 1321, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2321, 1321, 'Dummy question 1321', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4321, 2321, 3321, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1322, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3322, 1322, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2322, 1322, 'Dummy question 1322', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4322, 2322, 3322, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1323, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3323, 1323, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2323, 1323, 'Dummy question 1323', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4323, 2323, 3323, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1324, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3324, 1324, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2324, 1324, 'Dummy question 1324', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4324, 2324, 3324, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1325, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3325, 1325, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2325, 1325, 'Dummy question 1325', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4325, 2325, 3325, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1326, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3326, 1326, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2326, 1326, 'Dummy question 1326', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4326, 2326, 3326, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1327, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3327, 1327, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2327, 1327, 'Dummy question 1327', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4327, 2327, 3327, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1328, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3328, 1328, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2328, 1328, 'Dummy question 1328', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4328, 2328, 3328, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1329, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3329, 1329, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2329, 1329, 'Dummy question 1329', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4329, 2329, 3329, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1330, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3330, 1330, 6, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2330, 1330, 'Dummy question 1330', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4330, 2330, 3330, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1331, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3331, 1331, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2331, 1331, 'Dummy question 1331', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4331, 2331, 3331, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5121, 2331, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5122, 2331, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5123, 2331, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5124, 2331, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1332, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3332, 1332, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2332, 1332, 'Dummy question 1332', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4332, 2332, 3332, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5125, 2332, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5126, 2332, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5127, 2332, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5128, 2332, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1333, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3333, 1333, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2333, 1333, 'Dummy question 1333', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4333, 2333, 3333, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5129, 2333, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5130, 2333, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5131, 2333, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5132, 2333, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1334, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3334, 1334, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2334, 1334, 'Dummy question 1334', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4334, 2334, 3334, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5133, 2334, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5134, 2334, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5135, 2334, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5136, 2334, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1335, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3335, 1335, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2335, 1335, 'Dummy question 1335', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4335, 2335, 3335, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5137, 2335, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5138, 2335, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5139, 2335, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5140, 2335, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1336, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3336, 1336, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2336, 1336, 'Dummy question 1336', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4336, 2336, 3336, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1337, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3337, 1337, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2337, 1337, 'Dummy question 1337', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4337, 2337, 3337, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1338, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3338, 1338, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2338, 1338, 'Dummy question 1338', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4338, 2338, 3338, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1339, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3339, 1339, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2339, 1339, 'Dummy question 1339', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4339, 2339, 3339, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1340, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3340, 1340, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2340, 1340, 'Dummy question 1340', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4340, 2340, 3340, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1341, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3341, 1341, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2341, 1341, 'Dummy question 1341', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4341, 2341, 3341, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1342, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3342, 1342, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2342, 1342, 'Dummy question 1342', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4342, 2342, 3342, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1343, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3343, 1343, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2343, 1343, 'Dummy question 1343', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4343, 2343, 3343, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1344, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3344, 1344, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2344, 1344, 'Dummy question 1344', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4344, 2344, 3344, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1345, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3345, 1345, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2345, 1345, 'Dummy question 1345', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4345, 2345, 3345, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1346, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3346, 1346, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2346, 1346, 'Dummy question 1346', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4346, 2346, 3346, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1347, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3347, 1347, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2347, 1347, 'Dummy question 1347', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4347, 2347, 3347, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1348, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3348, 1348, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2348, 1348, 'Dummy question 1348', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4348, 2348, 3348, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1349, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3349, 1349, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2349, 1349, 'Dummy question 1349', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4349, 2349, 3349, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1350, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3350, 1350, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2350, 1350, 'Dummy question 1350', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4350, 2350, 3350, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1351, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3351, 1351, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2351, 1351, 'Dummy question 1351', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4351, 2351, 3351, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6091, 2351, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6092, 2351, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6093, 2351, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1352, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3352, 1352, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2352, 1352, 'Dummy question 1352', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4352, 2352, 3352, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6094, 2352, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6095, 2352, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6096, 2352, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1353, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3353, 1353, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2353, 1353, 'Dummy question 1353', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4353, 2353, 3353, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6097, 2353, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6098, 2353, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6099, 2353, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1354, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3354, 1354, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2354, 1354, 'Dummy question 1354', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4354, 2354, 3354, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6100, 2354, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6101, 2354, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6102, 2354, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1355, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3355, 1355, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2355, 1355, 'Dummy question 1355', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4355, 2355, 3355, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6103, 2355, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6104, 2355, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6105, 2355, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1356, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3356, 1356, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2356, 1356, 'Dummy question 1356', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4356, 2356, 3356, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1357, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3357, 1357, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2357, 1357, 'Dummy question 1357', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4357, 2357, 3357, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1358, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3358, 1358, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2358, 1358, 'Dummy question 1358', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4358, 2358, 3358, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1359, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3359, 1359, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2359, 1359, 'Dummy question 1359', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4359, 2359, 3359, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1360, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3360, 1360, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2360, 1360, 'Dummy question 1360', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4360, 2360, 3360, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1361, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3361, 1361, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2361, 1361, 'Dummy question 1361', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4361, 2361, 3361, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1362, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3362, 1362, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2362, 1362, 'Dummy question 1362', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4362, 2362, 3362, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1363, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3363, 1363, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2363, 1363, 'Dummy question 1363', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4363, 2363, 3363, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1364, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3364, 1364, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2364, 1364, 'Dummy question 1364', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4364, 2364, 3364, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1365, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3365, 1365, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2365, 1365, 'Dummy question 1365', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4365, 2365, 3365, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1366, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3366, 1366, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2366, 1366, 'Dummy question 1366', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4366, 2366, 3366, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1367, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3367, 1367, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2367, 1367, 'Dummy question 1367', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4367, 2367, 3367, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1368, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3368, 1368, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2368, 1368, 'Dummy question 1368', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4368, 2368, 3368, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1369, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3369, 1369, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2369, 1369, 'Dummy question 1369', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4369, 2369, 3369, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1370, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3370, 1370, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2370, 1370, 'Dummy question 1370', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4370, 2370, 3370, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1371, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3371, 1371, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2371, 1371, 'Dummy question 1371', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4371, 2371, 3371, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1372, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3372, 1372, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2372, 1372, 'Dummy question 1372', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4372, 2372, 3372, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1373, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3373, 1373, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2373, 1373, 'Dummy question 1373', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4373, 2373, 3373, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1374, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3374, 1374, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2374, 1374, 'Dummy question 1374', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4374, 2374, 3374, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1375, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3375, 1375, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2375, 1375, 'Dummy question 1375', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4375, 2375, 3375, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1376, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3376, 1376, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2376, 1376, 'Dummy question 1376', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4376, 2376, 3376, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1377, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3377, 1377, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2377, 1377, 'Dummy question 1377', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4377, 2377, 3377, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1378, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3378, 1378, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2378, 1378, 'Dummy question 1378', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4378, 2378, 3378, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1379, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3379, 1379, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2379, 1379, 'Dummy question 1379', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4379, 2379, 3379, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1380, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3380, 1380, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2380, 1380, 'Dummy question 1380', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4380, 2380, 3380, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1381, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3381, 1381, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2381, 1381, 'Dummy question 1381', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4381, 2381, 3381, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1382, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3382, 1382, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2382, 1382, 'Dummy question 1382', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4382, 2382, 3382, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1383, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3383, 1383, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2383, 1383, 'Dummy question 1383', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4383, 2383, 3383, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1384, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3384, 1384, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2384, 1384, 'Dummy question 1384', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4384, 2384, 3384, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1385, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3385, 1385, 7, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2385, 1385, 'Dummy question 1385', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4385, 2385, 3385, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1386, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3386, 1386, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2386, 1386, 'Dummy question 1386', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4386, 2386, 3386, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5141, 2386, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5142, 2386, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5143, 2386, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5144, 2386, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1387, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3387, 1387, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2387, 1387, 'Dummy question 1387', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4387, 2387, 3387, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5145, 2387, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5146, 2387, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5147, 2387, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5148, 2387, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1388, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3388, 1388, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2388, 1388, 'Dummy question 1388', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4388, 2388, 3388, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5149, 2388, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5150, 2388, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5151, 2388, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5152, 2388, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1389, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3389, 1389, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2389, 1389, 'Dummy question 1389', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4389, 2389, 3389, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5153, 2389, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5154, 2389, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5155, 2389, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5156, 2389, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1390, 1, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3390, 1390, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2390, 1390, 'Dummy question 1390', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4390, 2390, 3390, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5157, 2390, 'Option 1', true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5158, 2390, 'Option 2', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5159, 2390, 'Option 3', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES (5160, 2390, 'Option 4', false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1391, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3391, 1391, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2391, 1391, 'Dummy question 1391', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4391, 2391, 3391, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1392, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3392, 1392, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2392, 1392, 'Dummy question 1392', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4392, 2392, 3392, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1393, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3393, 1393, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2393, 1393, 'Dummy question 1393', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4393, 2393, 3393, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1394, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3394, 1394, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2394, 1394, 'Dummy question 1394', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4394, 2394, 3394, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1395, 2, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3395, 1395, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2395, 1395, 'Dummy question 1395', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4395, 2395, 3395, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1396, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3396, 1396, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2396, 1396, 'Dummy question 1396', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4396, 2396, 3396, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1397, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3397, 1397, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2397, 1397, 'Dummy question 1397', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4397, 2397, 3397, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1398, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3398, 1398, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2398, 1398, 'Dummy question 1398', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4398, 2398, 3398, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1399, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3399, 1399, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2399, 1399, 'Dummy question 1399', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4399, 2399, 3399, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1400, 3, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3400, 1400, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2400, 1400, 'Dummy question 1400', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4400, 2400, 3400, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1401, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3401, 1401, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2401, 1401, 'Dummy question 1401', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4401, 2401, 3401, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1402, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3402, 1402, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2402, 1402, 'Dummy question 1402', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4402, 2402, 3402, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1403, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3403, 1403, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2403, 1403, 'Dummy question 1403', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4403, 2403, 3403, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1404, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3404, 1404, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2404, 1404, 'Dummy question 1404', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4404, 2404, 3404, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1405, 4, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3405, 1405, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2405, 1405, 'Dummy question 1405', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4405, 2405, 3405, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1406, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3406, 1406, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2406, 1406, 'Dummy question 1406', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4406, 2406, 3406, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6106, 2406, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6107, 2406, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6108, 2406, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1407, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3407, 1407, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2407, 1407, 'Dummy question 1407', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4407, 2407, 3407, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6109, 2407, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6110, 2407, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6111, 2407, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1408, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3408, 1408, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2408, 1408, 'Dummy question 1408', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4408, 2408, 3408, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6112, 2408, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6113, 2408, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6114, 2408, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1409, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3409, 1409, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2409, 1409, 'Dummy question 1409', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4409, 2409, 3409, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6115, 2409, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6116, 2409, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6117, 2409, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1410, 5, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3410, 1410, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2410, 1410, 'Dummy question 1410', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4410, 2410, 3410, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6118, 2410, 'Left 1', 'Right 1', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6119, 2410, 'Left 2', 'Right 2', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES (6120, 2410, 'Left 3', 'Right 3', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1411, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3411, 1411, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2411, 1411, 'Dummy question 1411', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4411, 2411, 3411, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1412, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3412, 1412, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2412, 1412, 'Dummy question 1412', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4412, 2412, 3412, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1413, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3413, 1413, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2413, 1413, 'Dummy question 1413', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4413, 2413, 3413, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1414, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3414, 1414, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2414, 1414, 'Dummy question 1414', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4414, 2414, 3414, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1415, 6, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3415, 1415, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2415, 1415, 'Dummy question 1415', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4415, 2415, 3415, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1416, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3416, 1416, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2416, 1416, 'Dummy question 1416', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4416, 2416, 3416, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1417, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3417, 1417, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2417, 1417, 'Dummy question 1417', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4417, 2417, 3417, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1418, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3418, 1418, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2418, 1418, 'Dummy question 1418', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4418, 2418, 3418, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1419, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3419, 1419, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2419, 1419, 'Dummy question 1419', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4419, 2419, 3419, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1420, 7, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3420, 1420, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2420, 1420, 'Dummy question 1420', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4420, 2420, 3420, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1421, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3421, 1421, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2421, 1421, 'Dummy question 1421', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4421, 2421, 3421, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1422, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3422, 1422, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2422, 1422, 'Dummy question 1422', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4422, 2422, 3422, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1423, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3423, 1423, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2423, 1423, 'Dummy question 1423', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4423, 2423, 3423, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1424, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3424, 1424, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2424, 1424, 'Dummy question 1424', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4424, 2424, 3424, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1425, 8, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3425, 1425, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2425, 1425, 'Dummy question 1425', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4425, 2425, 3425, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1426, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3426, 1426, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2426, 1426, 'Dummy question 1426', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4426, 2426, 3426, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1427, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3427, 1427, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2427, 1427, 'Dummy question 1427', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4427, 2427, 3427, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1428, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3428, 1428, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2428, 1428, 'Dummy question 1428', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4428, 2428, 3428, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1429, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3429, 1429, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2429, 1429, 'Dummy question 1429', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4429, 2429, 3429, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1430, 9, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3430, 1430, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2430, 1430, 'Dummy question 1430', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4430, 2430, 3430, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1431, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3431, 1431, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2431, 1431, 'Dummy question 1431', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4431, 2431, 3431, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1432, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3432, 1432, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2432, 1432, 'Dummy question 1432', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4432, 2432, 3432, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1433, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3433, 1433, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2433, 1433, 'Dummy question 1433', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4433, 2433, 3433, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1434, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3434, 1434, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2434, 1434, 'Dummy question 1434', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4434, 2434, 3434, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1435, 10, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3435, 1435, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2435, 1435, 'Dummy question 1435', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4435, 2435, 3435, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1436, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3436, 1436, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2436, 1436, 'Dummy question 1436', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4436, 2436, 3436, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1437, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3437, 1437, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2437, 1437, 'Dummy question 1437', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4437, 2437, 3437, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1438, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3438, 1438, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2438, 1438, 'Dummy question 1438', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4438, 2438, 3438, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1439, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3439, 1439, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2439, 1439, 'Dummy question 1439', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4439, 2439, 3439, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');
INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES (1440, 11, false, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES (3440, 1440, 8, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES (2440, 1440, 'Dummy question 1440', '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30');
INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES (4440, 2440, 3440, 2, true, '2025-04-06 06:24:03+05:30', '2025-04-06 06:24:03+05:30', 'original');