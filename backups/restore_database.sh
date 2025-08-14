#!/bin/bash

# Database Restore Script
# Created: $(date)
# Usage: ./restore_database.sh [full|student]

DB_HOST="localhost"
DB_USER="mindstix"
DB_NAME="test_vista_db"
DB_PASSWORD="Nish@9894"

# Backup files
FULL_BACKUP="full_database_backup_20250627_121317.sql"
STUDENT_BACKUP="student_data_only_backup_20250627_121427.sql"

echo "=== Database Restore Script ==="
echo "Available options:"
echo "1. full    - Restore complete database (WARNING: This will drop and recreate the entire database)"
echo "2. student - Restore only student data (safer option)"
echo

if [ "$1" = "full" ]; then
    echo "⚠️  WARNING: This will completely replace your database!"
    echo "Current database will be dropped and recreated from backup."
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo "Restoring full database from backup..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -f "$FULL_BACKUP"
        echo "✅ Full database restore completed!"
    else
        echo "❌ Restore cancelled."
        exit 1
    fi

elif [ "$1" = "student" ]; then
    echo "Restoring student data only..."
    echo "⚠️  Note: This assumes the database schema is already in place."
    read -p "Continue with student data restore? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$STUDENT_BACKUP"
        echo "✅ Student data restore completed!"
    else
        echo "❌ Restore cancelled."
        exit 1
    fi

else
    echo "Usage: $0 [full|student]"
    echo
    echo "Examples:"
    echo "  $0 full     # Restore complete database"
    echo "  $0 student  # Restore only student data"
    exit 1
fi
