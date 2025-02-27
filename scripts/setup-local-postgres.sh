#!/bin/bash

# Script to set up a local PostgreSQL database for development

echo "Setting up local PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed. Please install it first."
    echo "You can install it with: brew install postgresql@14"
    echo "Then start it with: brew services start postgresql@14"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL service is not running. Starting it now..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql@14
    else
        # Linux
        sudo systemctl start postgresql
    fi
    sleep 5  # Wait for service to start
    
    # Check again if service started successfully
    if ! pg_isready &> /dev/null; then
        echo "Failed to start PostgreSQL service. Please start it manually."
        exit 1
    fi
fi

# Create database and user
echo "Creating database and user..."
createdb -U $(whoami) teach_niche_db 2>/dev/null || echo "Database already exists"

# Import schema from migrations file
echo "Importing schema from migrations file..."
psql -U $(whoami) -d teach_niche_db -f migrations/20250226_current_schema.sql

# Update .env file with connection details
echo "Updating .env file with local PostgreSQL connection details..."
cat >> .env.local << EOF

# Local PostgreSQL Connection
CLOUD_SQL_HOST=localhost
CLOUD_SQL_PORT=5432
CLOUD_SQL_USER=$(whoami)
CLOUD_SQL_DATABASE=teach_niche_db
# No password needed for local development with trust authentication
CLOUD_SQL_PASSWORD=
EOF

echo "Local PostgreSQL database setup complete!"
echo "You can now run the database verification script:"
echo "  node scripts/verify-migration.ts"
