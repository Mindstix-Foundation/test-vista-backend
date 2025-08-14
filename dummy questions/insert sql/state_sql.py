import json

# Load the JSON file
with open("state.json", "r") as file:
    states = json.load(file)

# Open an output file for SQL statements
with open("insert_states.sql", "w") as sql_file:
    sql_file.write('INSERT INTO "public"."State" (country_id, name) VALUES\n')
    values = []

    # Generate values for SQL
    for state in states:
        values.append(f"({state['country_id']}, '{state['state_name'].replace('\'', '\'\'')}')")  # Escape single quotes

    # Join values and add a semicolon at the end
    sql_file.write(",\n".join(values) + ";")

print("SQL file created: insert_states.sql")
