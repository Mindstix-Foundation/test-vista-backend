from datetime import datetime

# Question types from our database
question_types = [
    (1, "MCQ"), (2, "Odd One Out"), (3, "Complete the Correlation"),
    (4, "True or False"), (5, "Match the Pairs"), (6, "Fill in the Blanks"),
    (7, "One-Word Answer"), (8, "Give Scientific Reasons"),
    (9, "Short Answer Question"), (10, "Complete and Identify Reaction"), (11, "Short Note")
]

# Topic IDs from our setup (50001-50008)
topics = [50001, 50002, 50003, 50004, 50005, 50006, 50007, 50008]
instruction_medium_id = 50001  # English medium from our setup

timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S+05:30')

# Starting IDs - using higher ranges to avoid conflicts
question_id = 60000
question_text_id = 70000
question_topic_id = 80000
qttm_id = 90000
mcq_option_id = 100000
match_pair_id = 110000

sql_statements = []

# Mathematics topics with realistic question content
topic_questions = {
    50001: "Types of Relations",
    50002: "Types of Functions", 
    50003: "Composite Functions",
    50004: "Basic Concepts of Inverse Trigonometric Functions",
    50005: "Properties of Inverse Trigonometric Functions",
    50006: "Introduction to Matrices",
    50007: "Operations on Matrices",
    50008: "Transpose of a Matrix"
}

# Generate 5 questions per topic per question type
for topic_id in topics:
    topic_name = topic_questions[topic_id]
    
    for qtype_id, qtype_name in question_types:
        for i in range(5):
            question_id += 1
            question_text_id += 1
            question_topic_id += 1
            qttm_id += 1

            # Generate realistic question text based on topic and type
            if qtype_id == 1:  # MCQ
                question_text = f"Which of the following is true about {topic_name.lower()}?"
            elif qtype_id == 4:  # True/False
                question_text = f"Statement about {topic_name.lower()} is always true. (True/False)"
            elif qtype_id == 6:  # Fill in the blanks
                question_text = f"In {topic_name.lower()}, the main concept is _______."
            elif qtype_id == 7:  # One word answer
                question_text = f"What is the key term in {topic_name.lower()}?"
            elif qtype_id == 9:  # Short answer
                question_text = f"Explain the concept of {topic_name.lower()} with an example."
            elif qtype_id == 5:  # Match the pairs
                question_text = f"Match the following concepts related to {topic_name.lower()}:"
            else:
                question_text = f"Question about {topic_name.lower()} - Type: {qtype_name}"

            # Insert into Question
            sql_statements.append(f"""INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES ({question_id}, {qtype_id}, false, '{timestamp}', '{timestamp}');""")

            # Insert into Question_Topic
            sql_statements.append(f"""INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES ({question_topic_id}, {question_id}, {topic_id}, '{timestamp}', '{timestamp}');""")

            # Insert into Question_Text
            sql_statements.append(f"""INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES ({question_text_id}, {question_id}, '{question_text}', '{timestamp}', '{timestamp}');""")

            # Insert into Question_Text_Topic_Medium
            sql_statements.append(f"""INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES ({qttm_id}, {question_text_id}, {question_topic_id}, {instruction_medium_id}, true, '{timestamp}', '{timestamp}', 'original');""")

            # Insert MCQ Options for MCQ questions
            if qtype_id == 1:
                options = [
                    f"Correct answer for {topic_name}",
                    f"Incorrect option A for {topic_name}",
                    f"Incorrect option B for {topic_name}",
                    f"Incorrect option C for {topic_name}"
                ]
                for opt_idx, option_text in enumerate(options):
                    mcq_option_id += 1
                    is_correct = 'true' if opt_idx == 0 else 'false'
                    sql_statements.append(f"""INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES ({mcq_option_id}, {question_text_id}, '{option_text}', {is_correct}, '{timestamp}', '{timestamp}');""")

            # Insert Match Pairs for Match the Pairs questions
            if qtype_id == 5:
                pairs = [
                    (f"Concept A of {topic_name}", f"Definition A of {topic_name}"),
                    (f"Concept B of {topic_name}", f"Definition B of {topic_name}"),
                    (f"Concept C of {topic_name}", f"Definition C of {topic_name}")
                ]
                for left_text, right_text in pairs:
                    match_pair_id += 1
                    sql_statements.append(f"""INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES ({match_pair_id}, {question_text_id}, '{left_text}', '{right_text}', '{timestamp}', '{timestamp}');""")

# Print all SQL commands
print("\n".join(sql_statements)) 