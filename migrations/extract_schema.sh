#!/bin/bash

# Configuration
DB_HOST="localhost"
DB_PORT="54322"  # Default Supabase local development port
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="postgres"
OUTPUT_FILE="schema_dump.sql"

echo "Extracting schema from Supabase database..."

# Extract schema only (no data)
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --schema=public \
  --schema-only \
  -f $OUTPUT_FILE

if [ $? -eq 0 ]; then
  echo "Schema successfully extracted to $OUTPUT_FILE"
else
  echo "Error extracting schema. Trying alternative method..."
  
  # Alternative method using psql to get table information
  PGPASSWORD=$DB_PASSWORD psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -c "SELECT json_agg(t) FROM (SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position) t" \
    -t > schema.json
    
  if [ $? -eq 0 ]; then
    echo "Schema information extracted to schema.json"
  else
    echo "Both extraction methods failed. Please check your database connection."
  fi
fi

# Extract enum types
echo "Extracting enum types..."
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -c "SELECT n.nspname AS schema, t.typname AS type, e.enumlabel AS value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;" \
  -t > enum_types.txt

if [ $? -eq 0 ]; then
  echo "Enum types extracted to enum_types.txt"
fi
