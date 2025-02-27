#!/bin/bash

# Script to initialize the database with the schema

echo "Initializing database with schema..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed. Please install it first."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "You can install it with: brew install postgresql@14"
    else
        echo "You can install it with: sudo apt-get install postgresql"
    fi
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "migrations" ] || [ ! -f "migrations/20250226_current_schema.sql" ]; then
    echo "Error: Migrations directory or schema file not found."
    echo "Please make sure the migrations directory exists and contains 20250226_current_schema.sql"
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
fi

# Set default values if not in environment
DB_HOST=${CLOUD_SQL_HOST:-localhost}
DB_PORT=${CLOUD_SQL_PORT:-5432}
DB_USER=${CLOUD_SQL_USER:-$(whoami)}
DB_NAME=${CLOUD_SQL_DATABASE:-teach_niche_db}
DB_PASSWORD=${CLOUD_SQL_PASSWORD:-}

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
if [ -z "$DB_PASSWORD" ]; then
    # No password authentication
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists"
else
    # Password authentication
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists"
fi

# Import schema
echo "Importing schema from migrations file..."
if [ -z "$DB_PASSWORD" ]; then
    # No password authentication
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/20250226_current_schema.sql
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/20250227_add_creator_applications.sql
else
    # Password authentication
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/20250226_current_schema.sql
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/20250227_add_creator_applications.sql
fi

echo "Database initialization complete!"
echo "You can now run the verification script:"
echo "  node scripts/verify-migration.ts"
