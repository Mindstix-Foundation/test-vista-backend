import json

# Load the JSON file
with open("country.json", "r") as file:
    countries = json.load(file)

# Open an output file for SQL statements
with open("insert_countries.sql", "w") as sql_file:
    sql_file.write('INSERT INTO "Country" (name) VALUES\n')
    values = []

    # Generate values for SQL
    for country in countries:
        values.append(f"('{country['country_name'].replace("'", "''")}')")  # Escape single quotes

    # Join values and add a semicolon at the end
    sql_file.write(",\n".join(values) + ";")

print("SQL file created: insert_countries.sql")
