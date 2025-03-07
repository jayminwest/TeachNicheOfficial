#!/bin/bash
# db-unify.sh - Script to synchronize development database with production

# Set script to exit on error
set -e

# Load environment variables
echo "Loading environment variables..."
# Load production environment variables
if [ -f .env.vercel.production ]; then
  # Export all variables from the file - handle potential quote issues
  set -o allexport
  source .env.vercel.production
  set +o allexport
  
  # Store the specific variables we need
  PROD_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
  # Convert HTTPS URL to PostgreSQL connection string for Supabase CLI
  PROD_DB_URL="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@$(echo ${NEXT_PUBLIC_SUPABASE_URL} | sed 's|https://||' | sed 's|.supabase.co||').supabase.co:5432/postgres"
  PROD_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
  PROD_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
  PROD_JWT_SECRET=${JWT_SECRET}
else
  echo "Error: .env.vercel.production file not found"
  exit 1
fi

# Load development environment variables
if [ -f .env.dev ]; then
  # Export all variables from the file - handle potential quote issues
  set -o allexport
  source .env.dev
  set +o allexport
  
  # Store the specific variables we need
  DEV_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
  # Convert HTTPS URL to PostgreSQL connection string for Supabase CLI
  DEV_DB_URL="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@$(echo ${NEXT_PUBLIC_SUPABASE_URL} | sed 's|https://||' | sed 's|.supabase.co||').supabase.co:5432/postgres"
  DEV_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
  DEV_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
  DEV_JWT_SECRET=${JWT_SECRET}
else
  echo "Error: .env.dev file not found"
  exit 1
fi

# Verify environment variables are loaded
if [ -z "$PROD_SUPABASE_URL" ] || [ -z "$PROD_SUPABASE_SERVICE_KEY" ] || [ -z "$PROD_SUPABASE_ANON_KEY" ] || [ -z "$PROD_JWT_SECRET" ]; then
  echo "Error: Production Supabase credentials not found in .env.vercel.production"
  echo "Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, JWT_SECRET"
  echo "Current values:"
  echo "PROD_SUPABASE_URL: ${PROD_SUPABASE_URL:-not set}"
  echo "PROD_SUPABASE_SERVICE_KEY: ${PROD_SUPABASE_SERVICE_KEY:0:10}... (${#PROD_SUPABASE_SERVICE_KEY} chars)"
  echo "PROD_SUPABASE_ANON_KEY: ${PROD_SUPABASE_ANON_KEY:0:10}... (${#PROD_SUPABASE_ANON_KEY} chars)"
  echo "PROD_JWT_SECRET: ${PROD_JWT_SECRET:0:10}... (${#PROD_JWT_SECRET} chars)"
  exit 1
fi

# Test database connection before proceeding
echo "Testing database connections..."
if ! command -v pg_isready &> /dev/null; then
  echo "Warning: pg_isready not found, skipping connection test"
else
  # Extract host and port from connection strings
  PROD_HOST=$(echo $PROD_DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  DEV_HOST=$(echo $DEV_DB_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  
  # Function to validate connection string format
  validate_connection_string() {
    local conn_string=$1
    local name=$2
    
    # Check if the connection string has the expected format
    if [[ ! $conn_string =~ postgresql://[^:]+:[^@]+@[^:]+:[0-9]+/[^[:space:]]+ ]]; then
      echo "Warning: $name connection string may not be in the correct format."
      echo "Expected format: postgresql://postgres:password@host:5432/postgres"
      return 1
    fi
    return 0
  }
  
  # Validate connection strings instead of trying to connect directly
  # Direct connections to Supabase often fail due to IP restrictions
  echo "Validating production database connection string..."
  if ! validate_connection_string "$PROD_DB_URL" "Production"; then
    echo "Please check your production database connection string."
    echo "Continuing anyway, but commands may fail."
  else
    echo "Production database connection string format is valid."
  fi
  
  echo "Validating development database connection string..."
  if ! validate_connection_string "$DEV_DB_URL" "Development"; then
    echo "Please check your development database connection string."
    echo "Continuing anyway, but commands may fail."
  else
    echo "Development database connection string format is valid."
  fi
fi

if [ -z "$DEV_SUPABASE_URL" ] || [ -z "$DEV_SUPABASE_SERVICE_KEY" ] || [ -z "$DEV_SUPABASE_ANON_KEY" ] || [ -z "$DEV_JWT_SECRET" ]; then
  echo "Error: Development Supabase credentials not found in .env.dev"
  echo "Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, JWT_SECRET"
  echo "Current values:"
  echo "DEV_SUPABASE_URL: ${DEV_SUPABASE_URL:-not set}"
  echo "DEV_SUPABASE_SERVICE_KEY: ${DEV_SUPABASE_SERVICE_KEY:0:10}... (${#DEV_SUPABASE_SERVICE_KEY} chars)"
  echo "DEV_SUPABASE_ANON_KEY: ${DEV_SUPABASE_ANON_KEY:0:10}... (${#DEV_SUPABASE_ANON_KEY} chars)"
  echo "DEV_JWT_SECRET: ${DEV_JWT_SECRET:0:10}... (${#DEV_JWT_SECRET} chars)"
  exit 1
fi

# Create directories for exports
MIGRATIONS_DIR="app/lib/supabase/migrations"
EXPORTS_DIR="$MIGRATIONS_DIR/exports"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

mkdir -p $EXPORTS_DIR

echo "=== Database Unification Script ==="
echo "This script will synchronize your development database with production."
echo "Production database: $PROD_SUPABASE_URL"
echo "Development database: $DEV_SUPABASE_URL"
echo "Using PostgreSQL connection strings for Supabase CLI compatibility"

# Debug connection strings (masked for security)
echo "Production DB connection: ${PROD_DB_URL//:*/:*****@*****}"
echo "Development DB connection: ${DEV_DB_URL//:*/:*****@*****}"
echo ""
echo "WARNING: This will overwrite your development database with production schema."
read -p "Continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 1
fi

# Define a function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if supabase CLI is installed
if ! command_exists supabase; then
  echo "Error: Supabase CLI is not installed."
  echo "Please install it with: npm install -g supabase"
  exit 1
fi

# Step 1: Export production schema
echo "Step 1: Exporting production database schema..."
echo "This may take a moment..."

# Function to run command with timeout support for different platforms
function run_with_timeout() {
  local timeout_seconds=$1
  shift
  
  # Check if GNU timeout is available
  if command -v timeout &> /dev/null; then
    timeout $timeout_seconds "$@"
    return $?
  # Check if gtimeout is available (common on macOS with homebrew)
  elif command -v gtimeout &> /dev/null; then
    gtimeout $timeout_seconds "$@"
    return $?
  else
    # Fallback for macOS/BSD without timeout command
    # Use a more reliable approach with background process and trap
    
    # Create a temporary file to store the exit status
    local tmp_file=$(mktemp)
    echo "0" > "$tmp_file"
    
    # Start the command in background
    "$@" &
    local cmd_pid=$!
    
    # Set up a background process to kill the command after timeout
    (
      sleep $timeout_seconds
      if kill -0 $cmd_pid 2>/dev/null; then
        # Command still running after timeout
        kill -TERM $cmd_pid 2>/dev/null
        sleep 1
        kill -KILL $cmd_pid 2>/dev/null 
        echo "124" > "$tmp_file"  # Standard timeout exit code
      fi
    ) &
    local timer_pid=$!
    
    # Wait for the command to finish
    wait $cmd_pid 2>/dev/null || echo "$?" > "$tmp_file"
    
    # Kill the timer if it's still running
    kill $timer_pid 2>/dev/null || true
    
    # Get the exit status from the temp file
    local exit_status=$(cat "$tmp_file")
    rm -f "$tmp_file"
    
    return $exit_status
  fi
}
export -f run_with_timeout

# Function to handle command failures with better error messages
run_supabase_command() {
  local description=$1
  shift
  
  echo "Running: $description"
  "$@"
  local status=$?
  
  if [ $status -ne 0 ]; then
    echo "Error: Failed to $description."
    echo "This could be due to:"
    echo "  - Invalid connection string"
    echo "  - Network connectivity issues"
    echo "  - IP restrictions on Supabase database"
    echo "  - Insufficient permissions"
    echo ""
    echo "Troubleshooting tips:"
    echo "  - Verify your connection strings in .env.vercel.production and .env.dev"
    echo "  - Ensure you have the latest Supabase CLI installed"
    echo "  - Check if your IP is allowlisted in Supabase dashboard"
    return $status
  fi
  
  return 0
}

run_supabase_command "export production schema" \
  bash -c "export -f run_with_timeout && PGPASSWORD=\"$PROD_SUPABASE_SERVICE_KEY\" run_with_timeout 60 supabase db dump \
    --db-url \"$PROD_DB_URL\" \
    -f \"$EXPORTS_DIR/schema_$TIMESTAMP.sql\" \
    --schema public"

if [ $? -ne 0 ]; then
  echo "Error: Failed to export production schema."
  echo "You may need to use the Supabase dashboard to export the schema manually."
  echo "Visit: https://app.supabase.com/project/_/database/tables"
  echo "Then go to the SQL Editor and use pg_dump commands."
  exit 1
fi

# Step 2: Export RLS policies
echo "Step 2: Exporting RLS policies..."
run_supabase_command "export RLS policies" \
  bash -c "export -f run_with_timeout && PGPASSWORD=\"$PROD_SUPABASE_SERVICE_KEY\" run_with_timeout 30 supabase db dump \
    --db-url \"$PROD_DB_URL\" \
    -f \"$EXPORTS_DIR/rls_$TIMESTAMP.sql\" \
    --schema public \
    --include \"POLICY\""

if [ $? -ne 0 ]; then
  echo "Error: Failed to export RLS policies."
  echo "You may need to use the Supabase dashboard to export policies manually."
  echo "Visit: https://app.supabase.com/project/_/database/policies"
  exit 1
fi

# Step 3: Export functions and triggers
echo "Step 3: Exporting functions and triggers..."
run_supabase_command "export functions and triggers" \
  bash -c "export -f run_with_timeout && PGPASSWORD=\"$PROD_SUPABASE_SERVICE_KEY\" run_with_timeout 30 supabase db dump \
    --db-url \"$PROD_DB_URL\" \
    -f \"$EXPORTS_DIR/functions_$TIMESTAMP.sql\" \
    --schema public \
    --include \"FUNCTION TRIGGER\""

if [ $? -ne 0 ]; then
  echo "Error: Failed to export functions and triggers."
  echo "You may need to use the Supabase dashboard to export functions manually."
  echo "Visit: https://app.supabase.com/project/_/database/functions"
  exit 1
fi

# Step 4: Export auth configuration
echo "Step 4: Exporting auth configuration..."
run_supabase_command "export auth configuration" \
  bash -c "export -f run_with_timeout && PGPASSWORD=\"$PROD_SUPABASE_SERVICE_KEY\" run_with_timeout 30 supabase auth config export \
    --db-url \"$PROD_DB_URL\" \
    > \"$EXPORTS_DIR/auth_config_$TIMESTAMP.json\""

if [ $? -ne 0 ]; then
  echo "Error: Failed to export auth configuration."
  echo "You may need to use the Supabase dashboard to configure auth manually."
  echo "Visit: https://app.supabase.com/project/_/auth/providers"
  exit 1
fi

# Step 5: Create a consolidated migration file
echo "Step 5: Creating consolidated migration file..."
cat "$EXPORTS_DIR/schema_$TIMESTAMP.sql" "$EXPORTS_DIR/rls_$TIMESTAMP.sql" "$EXPORTS_DIR/functions_$TIMESTAMP.sql" > "$MIGRATIONS_DIR/current_state_$TIMESTAMP.sql"

# Step 6: Create migration tracking table
echo "Step 6: Creating migration tracking SQL..."
cat > "$MIGRATIONS_DIR/${TIMESTAMP}_migration_tracking.sql" << EOF
-- Migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  environment TEXT NOT NULL
);

-- Record this migration
INSERT INTO migration_history (migration_name, applied_by, environment)
VALUES ('${TIMESTAMP}_full_sync.sql', '$(whoami)', 'development');
EOF

# Step 7: Backup development database
echo "Step 7: Creating backup of development database..."
bash -c "PGPASSWORD=\"$DEV_SUPABASE_SERVICE_KEY\" supabase db dump \
  --db-url \"$DEV_DB_URL\" \
  -f \"$EXPORTS_DIR/dev_backup_$TIMESTAMP.sql\" \
  --schema public"

echo "Development database backed up to $EXPORTS_DIR/dev_backup_$TIMESTAMP.sql"

# Step 8: Apply schema to development
echo "Step 8: Applying production schema to development database..."
echo "This may take a few minutes..."

# First, drop all existing tables, functions, and policies
cat > "$EXPORTS_DIR/reset_dev_$TIMESTAMP.sql" << EOF
-- Drop all tables, functions, and policies
DO \$\$
DECLARE
  r RECORD;
BEGIN
  -- Disable all triggers
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL;';
  END LOOP;

  -- Drop all tables
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
  END LOOP;

  -- Drop all functions
  FOR r IN (SELECT proname, oidvectortypes(proargtypes) AS args FROM pg_proc WHERE pronamespace = 'public'::regnamespace) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE;';
  END LOOP;
END \$\$;
EOF

# Apply reset script
run_supabase_command "apply reset script to development database" \
  bash -c "PGPASSWORD=\"$DEV_SUPABASE_SERVICE_KEY\" supabase db push \
    --db-url \"$DEV_DB_URL\" \
    -f \"$EXPORTS_DIR/reset_dev_$TIMESTAMP.sql\""

# Apply consolidated schema
run_supabase_command "apply schema to development database" \
  bash -c "PGPASSWORD=\"$DEV_SUPABASE_SERVICE_KEY\" supabase db push \
    --db-url \"$DEV_DB_URL\" \
    -f \"$MIGRATIONS_DIR/current_state_$TIMESTAMP.sql\""

# Apply migration tracking
run_supabase_command "apply migration tracking to development database" \
  bash -c "PGPASSWORD=\"$DEV_SUPABASE_SERVICE_KEY\" supabase db push \
    --db-url \"$DEV_DB_URL\" \
    -f \"$MIGRATIONS_DIR/${TIMESTAMP}_migration_tracking.sql\""

# Step 9: Import auth configuration
echo "Step 9: Importing auth configuration..."
run_supabase_command "import auth configuration to development database" \
  bash -c "PGPASSWORD=\"$DEV_SUPABASE_SERVICE_KEY\" supabase auth config import \
    --db-url \"$DEV_DB_URL\" \
    \"$EXPORTS_DIR/auth_config_$TIMESTAMP.json\""

# Step 10: Verify synchronization
echo "Step 10: Verifying database synchronization..."
run_supabase_command "verify database synchronization" \
  bash -c "PGPASSWORD=\"$PROD_SUPABASE_SERVICE_KEY\" PGPASSWORD_TARGET=\"$DEV_SUPABASE_SERVICE_KEY\" supabase db diff \
    --source-db \"$PROD_DB_URL\" \
    --target-db \"$DEV_DB_URL\" \
    > \"$EXPORTS_DIR/verification_diff_$TIMESTAMP.txt\""

if [ -s "$EXPORTS_DIR/verification_diff_$TIMESTAMP.txt" ]; then
  echo "⚠️ Differences still exist between environments."
  echo "Review: $EXPORTS_DIR/verification_diff_$TIMESTAMP.txt"
else
  echo "✅ Environments are now synchronized!"
fi

# Step 11: Create updated migration files
echo "Step 11: Creating updated migration files..."

# Create a copy of the current rls_policies.sql file with timestamp
cp "$MIGRATIONS_DIR/rls_policies.sql" "$MIGRATIONS_DIR/rls_policies_backup_$TIMESTAMP.sql"

# Update the rls_policies.sql file with the new content
cp "$EXPORTS_DIR/rls_$TIMESTAMP.sql" "$MIGRATIONS_DIR/rls_policies.sql"

echo "Updated rls_policies.sql with current production policies."
echo "Original file backed up to rls_policies_backup_$TIMESTAMP.sql"

# Step 12: Create a policy inspection function
echo "Step 12: Creating policy inspection function..."
cat > "$MIGRATIONS_DIR/${TIMESTAMP}_policy_inspection.sql" << EOF
-- Function to inspect policies
CREATE OR REPLACE FUNCTION get_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  roles text[],
  cmd text,
  qual text,
  with_check text
) LANGUAGE sql SECURITY DEFINER AS \$\$
  SELECT
    schemaname::text,
    tablename::text,
    policyname::text,
    roles::text[],
    cmd::text,
    qual::text,
    with_check::text
  FROM
    pg_policies
  WHERE
    schemaname = 'public'
  ORDER BY
    tablename, policyname;
\$\$;
EOF

# Apply policy inspection function
run_supabase_command "apply policy inspection function to development database" \
  bash -c "PGPASSWORD=\"$DEV_SUPABASE_SERVICE_KEY\" supabase db push \
    --db-url \"$DEV_DB_URL\" \
    -f \"$MIGRATIONS_DIR/${TIMESTAMP}_policy_inspection.sql\""

echo ""
echo "=== Database Unification Complete ==="
echo "Summary:"
echo "- Production schema exported to: $EXPORTS_DIR/schema_$TIMESTAMP.sql"
echo "- RLS policies exported to: $EXPORTS_DIR/rls_$TIMESTAMP.sql"
echo "- Functions exported to: $EXPORTS_DIR/functions_$TIMESTAMP.sql"
echo "- Auth config exported to: $EXPORTS_DIR/auth_config_$TIMESTAMP.json"
echo "- Development database backed up to: $EXPORTS_DIR/dev_backup_$TIMESTAMP.sql"
echo "- Consolidated schema applied to development database"
echo "- Migration tracking table created"
echo "- Auth configuration imported"
echo "- Verification results saved to: $EXPORTS_DIR/verification_diff_$TIMESTAMP.txt"
echo "- RLS policies file updated and backed up"
echo "- Policy inspection function created"
echo ""
echo "Next steps:"
echo "1. Review any differences in verification_diff_$TIMESTAMP.txt"
echo "2. Test your application against the development database"
echo "3. Update your TypeScript types if schema has changed"
echo "4. Commit the updated migration files to your repository"
echo ""
echo "Troubleshooting:"
echo "If you encountered connection issues, you may need to:"
echo "1. Check IP allowlisting in Supabase dashboard"
echo "2. Verify your connection strings in environment files"
echo "3. Use the Supabase web interface for manual operations"
echo "4. Contact Supabase support if issues persist"
echo ""
echo "Done!"
