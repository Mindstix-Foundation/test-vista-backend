--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

-- Started on 2025-06-27 12:14:27 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3661 (class 0 OID 23316)
-- Dependencies: 287
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Student" (id, user_id, date_of_birth, enrollment_date, school_standard_id, status, created_at, updated_at, student_id) FROM stdin;
1	5	2001-02-16	2025-06-25	1	active	2025-06-25 18:22:25.558+05:30	2025-06-25 18:22:25.558+05:30	nb12
\.


--
-- TOC entry 3669 (class 0 OID 23367)
-- Dependencies: 295
-- Data for Name: Practice_Attempt; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Practice_Attempt" (id, student_id, subject_id, standard_id, chapter_id, topic_id, total_questions, started_at, completed_at, time_taken_seconds, score_percentage, correct_answers, wrong_answers, skipped_answers, created_at) FROM stdin;
\.


--
-- TOC entry 3673 (class 0 OID 23385)
-- Dependencies: 299
-- Data for Name: Practice_Answer; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Practice_Answer" (id, practice_attempt_id, question_id, question_text_id, selected_option_id, is_correct, time_spent_seconds, answered_at) FROM stdin;
\.


--
-- TOC entry 3677 (class 0 OID 23403)
-- Dependencies: 303
-- Data for Name: Student_Analytics; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Student_Analytics" (id, student_id, total_tests_taken, total_practice_tests, average_score, best_score, worst_score, last_score, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3665 (class 0 OID 23340)
-- Dependencies: 291
-- Data for Name: Test_Assignment; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Test_Assignment" (id, student_id, test_paper_id, assigned_by_user_id, assigned_date, due_date, available_from, max_attempts, time_limit_minutes, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3667 (class 0 OID 23353)
-- Dependencies: 293
-- Data for Name: Test_Attempt; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Test_Attempt" (id, student_id, test_assignment_id, attempt_number, started_at, submitted_at, time_taken_seconds, status, current_question, is_practice, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3671 (class 0 OID 23376)
-- Dependencies: 297
-- Data for Name: Student_Answer; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Student_Answer" (id, test_attempt_id, question_id, question_text_id, selected_option_id, is_correct, marks_obtained, time_spent_seconds, is_flagged, answered_at) FROM stdin;
\.


--
-- TOC entry 3679 (class 0 OID 23413)
-- Dependencies: 305
-- Data for Name: Student_Notification; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Student_Notification" (id, student_id, title, message, type, priority, is_read, action_url, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 3675 (class 0 OID 23393)
-- Dependencies: 301
-- Data for Name: Student_Result; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Student_Result" (id, student_id, test_attempt_id, total_questions, attempted_questions, correct_answers, wrong_answers, skipped_questions, total_marks, obtained_marks, percentage, grade, rank_in_standard, time_taken_seconds, performance_level, subject_wise_scores, chapter_wise_analysis, strengths, weaknesses, recommendations, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3663 (class 0 OID 23328)
-- Dependencies: 289
-- Data for Name: Student_Subject_Enrollment; Type: TABLE DATA; Schema: public; Owner: mindstix
--

COPY public."Student_Subject_Enrollment" (id, student_id, teacher_subject_id, status, request_message, teacher_response, academic_year, requested_at, responded_at, enrollment_date, created_at, updated_at) FROM stdin;
14	1	3	approved		Request approved	2025-2026	2025-06-26 12:42:13.909+05:30	2025-06-26 12:50:13.707+05:30	2025-06-26	2025-06-26 12:42:13.909+05:30	2025-06-26 12:50:13.71+05:30
26	1	5	approved		Request approved	2025-2026	2025-06-26 18:59:06.28+05:30	2025-06-26 19:30:55.761+05:30	2025-06-26	2025-06-26 18:59:06.28+05:30	2025-06-26 19:30:55.764+05:30
\.


--
-- TOC entry 3685 (class 0 OID 0)
-- Dependencies: 298
-- Name: Practice_Answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Practice_Answer_id_seq"', 1, false);


--
-- TOC entry 3686 (class 0 OID 0)
-- Dependencies: 294
-- Name: Practice_Attempt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Practice_Attempt_id_seq"', 1, false);


--
-- TOC entry 3687 (class 0 OID 0)
-- Dependencies: 302
-- Name: Student_Analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Student_Analytics_id_seq"', 1, false);


--
-- TOC entry 3688 (class 0 OID 0)
-- Dependencies: 296
-- Name: Student_Answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Student_Answer_id_seq"', 1, false);


--
-- TOC entry 3689 (class 0 OID 0)
-- Dependencies: 304
-- Name: Student_Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Student_Notification_id_seq"', 1, false);


--
-- TOC entry 3690 (class 0 OID 0)
-- Dependencies: 300
-- Name: Student_Result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Student_Result_id_seq"', 1, false);


--
-- TOC entry 3691 (class 0 OID 0)
-- Dependencies: 288
-- Name: Student_Subject_Enrollment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Student_Subject_Enrollment_id_seq"', 26, true);


--
-- TOC entry 3692 (class 0 OID 0)
-- Dependencies: 286
-- Name: Student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Student_id_seq"', 1, true);


--
-- TOC entry 3693 (class 0 OID 0)
-- Dependencies: 290
-- Name: Test_Assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Test_Assignment_id_seq"', 1, false);


--
-- TOC entry 3694 (class 0 OID 0)
-- Dependencies: 292
-- Name: Test_Attempt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: mindstix
--

SELECT pg_catalog.setval('public."Test_Attempt_id_seq"', 1, false);


-- Completed on 2025-06-27 12:14:27 IST

--
-- PostgreSQL database dump complete
--

