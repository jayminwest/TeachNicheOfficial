-- Schema Verification Steps for Supabase Database Sync
-- Use these queries to verify that your schema was properly replicated

-- 1. Verify Custom Types
-- Check that the custom types were created correctly
SELECT typname, typtype, typcategory 
FROM pg_type 
WHERE typname IN ('lesson_status', 'purchase_status');

-- 2. Verify Foreign Key Constraints
-- Check that all foreign key constraints were properly created
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name, 
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 3. Export RLS Policies
-- If your tables had RLS policies in production, you'll need to recreate them in dev
SELECT 
  'CREATE POLICY ' || 
  quote_ident(policyname) || 
  ' ON ' || 
  quote_ident(schemaname) || '.' || quote_ident(tablename) || 
  ' AS ' || permissive || 
  ' FOR ' || cmd || 
  ' TO ' || roles || 
  ' USING (' || qual::text || ')' || 
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check::text || ')' ELSE '' END || 
  ';' AS policy_statement
FROM pg_policies
WHERE schemaname = 'public';

-- 4. Export Custom Indexes
-- Export and recreate any custom indexes
SELECT 
  'CREATE INDEX ' || 
  quote_ident(indexname) || 
  ' ON ' || 
  quote_ident(schemaname) || '.' || quote_ident(tablename) || 
  ' USING ' || indexdef || ';' AS create_index_statement
FROM 
  pg_indexes 
WHERE 
  schemaname = 'public' AND 
  indexname NOT LIKE '%_pkey' AND
  indexname NOT LIKE '%_idx';

-- 5. Export Functions
-- If you have any custom functions, export and recreate them
SELECT 'CREATE OR REPLACE FUNCTION ' || 
       quote_ident(n.nspname) || '.' || quote_ident(p.proname) || 
       '(' || pg_get_function_arguments(p.oid) || ') ' || 
       'RETURNS ' || pg_get_function_result(p.oid) || ' AS $BODY$ ' || 
       pg_get_functiondef(p.oid) || ' $BODY$ LANGUAGE ' || 
       l.lanname || ';'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public';

-- 6. Export Triggers
-- If you have any triggers, export and recreate them
SELECT 'CREATE TRIGGER ' || 
       quote_ident(t.tgname) || ' ' || 
       CASE WHEN t.tgtype & 2 > 0 THEN 'BEFORE ' 
            WHEN t.tgtype & 4 > 0 THEN 'AFTER ' 
            WHEN t.tgtype & 64 > 0 THEN 'INSTEAD OF ' 
            ELSE '' END || 
       CASE WHEN t.tgtype & 8 > 0 THEN 'INSERT ' ELSE '' END || 
       CASE WHEN t.tgtype & 16 > 0 THEN 'DELETE ' ELSE '' END || 
       CASE WHEN t.tgtype & 32 > 0 THEN 'UPDATE ' ELSE '' END || 
       'ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' ' || 
       CASE WHEN t.tgtype & 1 > 0 THEN 'FOR EACH ROW ' ELSE 'FOR EACH STATEMENT ' END || 
       'EXECUTE FUNCTION ' || quote_ident(np.nspname) || '.' || 
       quote_ident(p.proname) || '();'
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace np ON p.pronamespace = np.oid
WHERE n.nspname = 'public' AND t.tgisinternal = false;

-- 7. Re-enable RLS
-- Make sure RLS is re-enabled on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    ) 
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable RLS on table %', r.tablename;
        END;
    END LOOP;
END $$;

-- 8. Verify Schema Completeness
-- Compare table counts between production and dev
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Compare column counts
SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public';

-- List all tables to verify they exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 9. Verify Table Structure
-- For each table, verify its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name, 
  ordinal_position;
