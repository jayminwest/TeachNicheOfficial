#!/bin/bash
# db-unify.sh - Script to synchronize development database with production

# Set script to exit on error
set -e

# Load environment variables
echo "Loading environment variables..."
if [ -f .env.vercel.production ]; then
  export $(grep -v '^#' .env.vercel.production | xargs)
  PROD_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
  PROD_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
fi

if [ -f .env.dev ]; then
  export $(grep -v '^#' .env.dev | xargs)
  DEV_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
  DEV_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
fi

# Verify environment variables are loaded
if [ -z "$PROD_SUPABASE_URL" ] || [ -z "$PROD_SUPABASE_SERVICE_KEY" ]; then
  echo "Error: Production Supabase credentials not found in .env.vercel.production"
  exit 1
fi

if [ -z "$DEV_SUPABASE_URL" ] || [ -z "$DEV_SUPABASE_SERVICE_KEY" ]; then
  echo "Error: Development Supabase credentials not found in .env.dev"
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
echo ""
echo "WARNING: This will overwrite your development database with production schema."
read -p "Continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 1
fi

# Step 1: Export production schema
echo "Step 1: Exporting production database schema..."
PGPASSWORD="$PROD_SUPABASE_SERVICE_KEY" supabase db dump \
  --db-url "$PROD_SUPABASE_URL" \
  -f "$EXPORTS_DIR/schema_$TIMESTAMP.sql" \
  --schema public

# Step 2: Export RLS policies
echo "Step 2: Exporting RLS policies..."
PGPASSWORD="$PROD_SUPABASE_SERVICE_KEY" supabase db dump \
  --db-url "$PROD_SUPABASE_URL" \
  -f "$EXPORTS_DIR/rls_$TIMESTAMP.sql" \
  --schema public \
  --include "POLICY"

# Step 3: Export functions and triggers
echo "Step 3: Exporting functions and triggers..."
PGPASSWORD="$PROD_SUPABASE_SERVICE_KEY" supabase db dump \
  --db-url "$PROD_SUPABASE_URL" \
  -f "$EXPORTS_DIR/functions_$TIMESTAMP.sql" \
  --schema public \
  --include "FUNCTION TRIGGER"

# Step 4: Export auth configuration
echo "Step 4: Exporting auth configuration..."
PGPASSWORD="$PROD_SUPABASE_SERVICE_KEY" supabase auth config export \
  --db-url "$PROD_SUPABASE_URL" \
  > "$EXPORTS_DIR/auth_config_$TIMESTAMP.json"

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
PGPASSWORD="$DEV_SUPABASE_SERVICE_KEY" supabase db dump \
  --db-url "$DEV_SUPABASE_URL" \
  -f "$EXPORTS_DIR/dev_backup_$TIMESTAMP.sql" \
  --schema public

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
PGPASSWORD="$DEV_SUPABASE_SERVICE_KEY" supabase db push \
  --db-url "$DEV_SUPABASE_URL" \
  -f "$EXPORTS_DIR/reset_dev_$TIMESTAMP.sql"

# Apply consolidated schema
PGPASSWORD="$DEV_SUPABASE_SERVICE_KEY" supabase db push \
  --db-url "$DEV_SUPABASE_URL" \
  -f "$MIGRATIONS_DIR/current_state_$TIMESTAMP.sql"

# Apply migration tracking
PGPASSWORD="$DEV_SUPABASE_SERVICE_KEY" supabase db push \
  --db-url "$DEV_SUPABASE_URL" \
  -f "$MIGRATIONS_DIR/${TIMESTAMP}_migration_tracking.sql"

# Step 9: Import auth configuration
echo "Step 9: Importing auth configuration..."
PGPASSWORD="$DEV_SUPABASE_SERVICE_KEY" supabase auth config import \
  --db-url "$DEV_SUPABASE_URL" \
  "$EXPORTS_DIR/auth_config_$TIMESTAMP.json"

# Step 10: Verify synchronization
echo "Step 10: Verifying database synchronization..."
PGPASSWORD="$PROD_SUPABASE_SERVICE_KEY" PGPASSWORD_TARGET="$DEV_SUPABASE_SERVICE_KEY" supabase db diff \
  --source-db "$PROD_SUPABASE_URL" \
  --target-db "$DEV_SUPABASE_URL" \
  > "$EXPORTS_DIR/verification_diff_$TIMESTAMP.txt"

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
PGPASSWORD="$DEV_SUPABASE_SERVICE_KEY" supabase db push \
  --db-url "$DEV_SUPABASE_URL" \
  -f "$MIGRATIONS_DIR/${TIMESTAMP}_policy_inspection.sql"

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
echo "Done!"
