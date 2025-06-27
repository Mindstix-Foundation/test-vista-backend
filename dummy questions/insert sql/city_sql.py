import json

# Load the JSON file
with open("city.json", "r") as file:
    cities = json.load(file)

# Open an output file for SQL statements
with open("insert_cities.sql", "w") as sql_file:
    sql_file.write('INSERT INTO "public"."City" (state_id, name) VALUES\n')
    values = []

    # Generate values for SQL
    for city in cities:
        values.append(f"({city['state_id']}, '{city['city_name'].replace('\'', '\'\'')}')")  # Escape single quotes

    # Join values and add a semicolon at the end
    sql_file.write(",\n".join(values) + ";")

print("SQL file created: insert_cities.sql")
