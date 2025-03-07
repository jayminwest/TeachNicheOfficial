# Issue Report: Database Environment Synchronization

## Issue Description

Our Supabase development database branch is not consistently synchronized with the production environment. This leads to:

1. Inconsistent Row-Level Security (RLS) policies between environments
2. Schema differences causing deployment failures
3. Authentication setup mismatches
4. Outdated migration files that don't reflect the current database state

This issue requires a comprehensive solution to ensure our development environment accurately mirrors production, following our project's standards for documentation and avoiding temporary solutions.

## Technical Analysis

The root causes of this issue are:

1. **Outdated Migration Files**: Our `app/lib/supabase/migrations/rls_policies.sql` and other migration files are not up-to-date with the current production schema
2. **Manual Schema Changes**: Some changes have been made directly to the production database without being properly documented in migration files
3. **Lack of Synchronization Process**: No standardized process exists for keeping environments in sync
4. **Missing Verification Steps**: No automated verification to confirm environment consistency

## Reproduction Steps

1. Compare the current production database schema with our migration files:
```bash
supabase db dump -f current_schema.sql --db-url $PROD_DB_URL --schema public --no-data
diff app/lib/supabase/migrations/rls_policies.sql current_rls.sql
```

2. Observe discrepancies between the exported schema and our migration files
3. Attempt to apply our existing migrations to a fresh database and note the differences from production

## Expected Behavior

All database environments (production, development, local) should have identical:
- Table schemas and relationships
- RLS policies and security settings
- Functions, triggers, and stored procedures
- Authentication provider configurations

Changes should be tracked through versioned migration files that can be applied sequentially to reproduce the exact database state.

## Proposed Solution

### 1. Export Current Production State

```bash
# Set environment variables
PROD_DB_URL="your_production_db_url"
DEV_DB_URL="your_development_db_url"
MIGRATIONS_DIR="app/lib/supabase/migrations"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Create exports directory if it doesn't exist
mkdir -p $MIGRATIONS_DIR/exports

# Export complete schema (no data)
supabase db dump -f $MIGRATIONS_DIR/exports/schema_$TIMESTAMP.sql --db-url $PROD_DB_URL --schema public --no-data

# Export RLS policies specifically
supabase db dump -f $MIGRATIONS_DIR/exports/rls_$TIMESTAMP.sql --db-url $PROD_DB_URL --schema public --include "POLICY"

# Export functions and triggers
supabase db dump -f $MIGRATIONS_DIR/exports/functions_$TIMESTAMP.sql --db-url $PROD_DB_URL --schema public --include "FUNCTION TRIGGER"

# Export auth configuration
supabase auth config export --db-url $PROD_DB_URL > $MIGRATIONS_DIR/exports/auth_config_$TIMESTAMP.json
```

### 2. Create Updated Migration Files

```bash
# Create new migration files with timestamps
touch $MIGRATIONS_DIR/${TIMESTAMP}_schema_update.sql
touch $MIGRATIONS_DIR/${TIMESTAMP}_rls_update.sql
touch $MIGRATIONS_DIR/${TIMESTAMP}_functions_update.sql

# Create a consolidated reference file (not for direct execution)
touch $MIGRATIONS_DIR/current_state_reference.sql
```

### 3. Compare and Extract Differences

```bash
# Compare with existing migration files
diff $MIGRATIONS_DIR/rls_policies.sql $MIGRATIONS_DIR/exports/rls_$TIMESTAMP.sql > $MIGRATIONS_DIR/diff_rls.txt

# Use the diff output to manually update the new migration files
# This requires careful review to include only the necessary changes
```

### 4. Apply Migrations to Development

```bash
# Apply schema updates
supabase db push --db-url $DEV_DB_URL -f $MIGRATIONS_DIR/${TIMESTAMP}_schema_update.sql

# Apply RLS updates
supabase db push --db-url $DEV_DB_URL -f $MIGRATIONS_DIR/${TIMESTAMP}_rls_update.sql

# Apply function updates
supabase db push --db-url $DEV_DB_URL -f $MIGRATIONS_DIR/${TIMESTAMP}_functions_update.sql

# Import auth configuration
supabase auth config import --db-url $DEV_DB_URL $MIGRATIONS_DIR/exports/auth_config_$TIMESTAMP.json
```

### 5. Verify Synchronization

```bash
# Compare schemas after migration
supabase db diff --source-db $PROD_DB_URL --target-db $DEV_DB_URL > $MIGRATIONS_DIR/verification_diff.txt

# Check if there are any remaining differences
if [ -s "$MIGRATIONS_DIR/verification_diff.txt" ]; then
  echo "Differences still exist between environments. Review verification_diff.txt"
else
  echo "Environments are now synchronized!"
fi
```

### 6. Create Migration Tracking System

```sql
-- Add to a new migration file: ${TIMESTAMP}_migration_tracking.sql
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  environment TEXT NOT NULL
);

-- Record each migration
INSERT INTO migration_history (migration_name, applied_by, environment)
VALUES ('${TIMESTAMP}_schema_update.sql', 'developer_name', 'development');
```

### 7. Create Database Sync Script

```bash
#!/bin/bash
# sync-database.sh

# Set environment variables
PROD_DB_URL="your_production_db_url"
DEV_DB_URL="your_development_db_url"
MIGRATIONS_DIR="app/lib/supabase/migrations"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Function to apply migrations
apply_migrations() {
  local DB_URL=$1
  local ENV_NAME=$2
  
  echo "Applying migrations to $ENV_NAME environment..."
  
  # Apply all migrations in order
  for migration in $(ls -v $MIGRATIONS_DIR/*.sql | grep -v "current_state_reference.sql"); do
    echo "Applying migration: $migration"
    supabase db push --db-url $DB_URL -f $migration
    
    # Record migration in history table
    psql $DB_URL -c "INSERT INTO migration_history (migration_name, applied_by, environment) VALUES ('$(basename $migration)', '$(whoami)', '$ENV_NAME');"
  done
  
  echo "Migrations applied to $ENV_NAME environment."
}

# Function to verify environments
verify_environments() {
  echo "Verifying environment consistency..."
  supabase db diff --source-db $PROD_DB_URL --target-db $DEV_DB_URL > $MIGRATIONS_DIR/verification_diff.txt
  
  if [ -s "$MIGRATIONS_DIR/verification_diff.txt" ]; then
    echo "⚠️ Differences exist between environments. Review verification_diff.txt"
    return 1
  else
    echo "✅ Environments are synchronized!"
    return 0
  fi
}

# Main execution
echo "Starting database synchronization..."

# Apply migrations to development
apply_migrations $DEV_DB_URL "development"

# Verify environments
verify_environments

echo "Database sync process complete!"
```

### 8. Create Database Verification Test

```typescript
// tests/database-verification.test.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../app/types/database';

describe('Database Configuration Verification', () => {
  const prodClient = createClient<Database>(
    process.env.PROD_SUPABASE_URL!,
    process.env.PROD_SUPABASE_KEY!
  );
  
  const devClient = createClient<Database>(
    process.env.DEV_SUPABASE_URL!,
    process.env.DEV_SUPABASE_KEY!
  );
  
  test('Tables structure matches between environments', async () => {
    // Get table information from both environments
    const prodTables = await prodClient
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    const devTables = await devClient
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');
    
    // Compare table counts
    expect(prodTables.data?.length).toEqual(devTables.data?.length);
    
    // Compare table names
    const prodTableNames = prodTables.data?.map(t => t.table_name).sort();
    const devTableNames = devTables.data?.map(t => t.table_name).sort();
    expect(prodTableNames).toEqual(devTableNames);
  });
  
  test('RLS policies match between environments', async () => {
    // Query pg_policies to get RLS policies
    const prodPolicies = await prodClient.rpc('get_policies');
    const devPolicies = await devClient.rpc('get_policies');
    
    // Compare policy counts
    expect(prodPolicies.data?.length).toEqual(devPolicies.data?.length);
    
    // Compare policy details
    const prodPolicyNames = prodPolicies.data?.map(p => p.policyname).sort();
    const devPolicyNames = devPolicies.data?.map(p => p.policyname).sort();
    expect(prodPolicyNames).toEqual(devPolicyNames);
  });
});
```

### 9. Create RPC Function for Policy Inspection

```sql
-- Add to a new migration file: ${TIMESTAMP}_policy_inspection.sql
CREATE OR REPLACE FUNCTION get_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  roles text[],
  cmd text,
  qual text,
  with_check text
) LANGUAGE sql SECURITY DEFINER AS $$
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
$$;
```

## Testing Requirements

After implementing the solution:

1. **Schema Verification**: Confirm all tables, columns, and constraints match between environments
2. **RLS Policy Testing**: Test each RLS policy with different user roles to ensure consistent behavior
3. **Function Testing**: Verify all database functions produce identical results in both environments
4. **Auth Flow Testing**: Test authentication flows to ensure consistent behavior
5. **Migration Testing**: Apply migrations to a fresh database and verify it matches production

## Additional Context

This issue aligns with our project's core philosophy as outlined in the documentation:

- **Modularity**: Each migration file should have a single, well-defined responsibility
- **Type Safety**: Database schema should be consistent with our TypeScript types
- **Documentation**: All database changes should be well-documented
- **No Temporary Solutions**: Following our principle of NEVER using temporary workarounds in production

## Implementation Checklist

- [ ] Export current production database state
- [ ] Create updated migration files
- [ ] Apply migrations to development environment
- [ ] Verify environment synchronization
- [ ] Implement migration tracking system
- [ ] Create database sync script
- [ ] Add database verification tests
- [ ] Document the synchronization process
- [ ] Set up regular sync schedule
- [ ] Train team on the new process

## Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [PostgreSQL Policy Documentation](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Database Migration Best Practices](https://supabase.com/docs/guides/database/migrations)

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-07 | Documentation Team | Initial issue report |
