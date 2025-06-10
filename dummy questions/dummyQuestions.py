from datetime import datetime

question_types = [
    (1, "MCQ"), (2, "Odd One Out"), (3, "Complete the Correlation"),
    (4, "True or False"), (5, "Match the Pairs"), (6, "Fill in the Blanks"),
    (7, "One-Word Answer"), (8, "Give Scientific Reasons"),
    (9, "Short Answer Question"), (10, "Complete and Identify Reaction"), (11, "Short Note")
]

topics = [1, 2, 3, 4, 5, 6, 7, 8]  # Topic IDs
instruction_medium_id = 2

timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S+05:30')

question_id = 1000
question_text_id = 2000
question_topic_id = 3000
qttm_id = 4000
mcq_option_id = 5000
match_pair_id = 6000

sql_statements = []

for topic_id in topics:
    for qtype_id, qtype_name in question_types:
        for i in range(5):
            question_id += 1
            question_text_id += 1
            question_topic_id += 1
            qttm_id += 1

            # Insert into Question
            sql_statements.append(f"""INSERT INTO "Question" (id, question_type_id, board_question, created_at, updated_at) 
VALUES ({question_id}, {qtype_id}, false, '{timestamp}', '{timestamp}');""")

            # Insert into Question_Topic
            sql_statements.append(f"""INSERT INTO "Question_Topic" (id, question_id, topic_id, created_at, updated_at) 
VALUES ({question_topic_id}, {question_id}, {topic_id}, '{timestamp}', '{timestamp}');""")

            # Insert into Question_Text
            sql_statements.append(f"""INSERT INTO "Question_Text" (id, question_id, question_text, created_at, updated_at) 
VALUES ({question_text_id}, {question_id}, 'Dummy question {question_id}', '{timestamp}', '{timestamp}');""")

            # Insert into Question_Text_Topic_Medium
            sql_statements.append(f"""INSERT INTO "Question_Text_Topic_Medium" 
(id, question_text_id, question_topic_id, instruction_medium_id, is_verified, created_at, updated_at, translation_status) 
VALUES ({qttm_id}, {question_text_id}, {question_topic_id}, {instruction_medium_id}, false, '{timestamp}', '{timestamp}', 'original');""")

            # Insert MCQ Options
            if qtype_id == 1:
                for opt in range(4):
                    mcq_option_id += 1
                    is_correct = 'true' if opt == 0 else 'false'
                    sql_statements.append(f"""INSERT INTO "Mcq_Option" 
(id, question_text_id, option_text, is_correct, created_at, updated_at) 
VALUES ({mcq_option_id}, {question_text_id}, 'Option {opt + 1}', {is_correct}, '{timestamp}', '{timestamp}');""")

            # Insert Match Pair
            if qtype_id == 5:
                for pair in range(3):
                    match_pair_id += 1
                    sql_statements.append(f"""INSERT INTO "Match_Pair" 
(id, question_text_id, left_text, right_text, created_at, updated_at) 
VALUES ({match_pair_id}, {question_text_id}, 'Left {pair + 1}', 'Right {pair + 1}', '{timestamp}', '{timestamp}');""")

# Print all SQL commands
print("\n".join(sql_statements))

