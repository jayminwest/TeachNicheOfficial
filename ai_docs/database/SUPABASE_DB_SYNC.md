# Supabase Database Sync Guide

This guide provides SQL commands to sync your development database with your production database using the Supabase UI.

## Step 1: Export Schema and Data from Production Database

1. Log in to your Supabase dashboard
2. Select your **Production** project
3. Navigate to the SQL Editor
4. Create a new query and paste the following SQL:

```sql
-- Step 1: Get all tables in the public schema
WITH tables AS (
  SELECT tablename 
  FROM pg_tables 
  WHERE schemaname = 'public'
)
-- Step 2: Generate DROP TABLE statements for all tables
SELECT 'DROP TABLE IF EXISTS public.' || quote_ident(tablename) || ' CASCADE;' AS drop_statement
FROM tables
ORDER BY tablename;
```

RESULT:
| drop_statement                                            |
| --------------------------------------------------------- |
| DROP TABLE IF EXISTS public.categories CASCADE;           |
| DROP TABLE IF EXISTS public.creator_earnings CASCADE;     |
| DROP TABLE IF EXISTS public.lesson_category CASCADE;      |
| DROP TABLE IF EXISTS public.lesson_request_votes CASCADE; |
| DROP TABLE IF EXISTS public.lesson_requests CASCADE;      |
| DROP TABLE IF EXISTS public.lessons CASCADE;              |
| DROP TABLE IF EXISTS public.profiles CASCADE;             |
| DROP TABLE IF EXISTS public.purchases CASCADE;            |
| DROP TABLE IF EXISTS public.reviews CASCADE;              |
| DROP TABLE IF EXISTS public.waitlist CASCADE;             |

5. Run the query and save the output - these are your DROP statements for the dev database

6. Create another query with this SQL to generate your schema:

```sql
-- Generate CREATE TABLE statements for all tables in public schema
SELECT 
  'CREATE TABLE IF NOT EXISTS ' || 
  quote_ident(table_schema) || '.' || quote_ident(table_name) || 
  E' (\n' ||
  string_agg(
    '  ' || quote_ident(column_name) || ' ' || 
    data_type || 
    CASE 
      WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
      WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
      ELSE ''
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    E',\n'
  ) ||
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_schema = columns.table_schema AND tc.table_name = columns.table_name AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN
      E',\n  PRIMARY KEY (' || 
      (
        SELECT string_agg(quote_ident(ccu.column_name), ', ')
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = columns.table_schema AND tc.table_name = columns.table_name AND tc.constraint_type = 'PRIMARY KEY'
      ) || ')'
    ELSE ''
  END ||
  E'\n);' AS create_statement
FROM information_schema.columns
JOIN (
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) AS tables USING (table_schema, table_name)
GROUP BY table_schema, table_name
ORDER BY table_schema, table_name;
```

RESULT:
| create_statement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CREATE TABLE IF NOT EXISTS public.creator_earnings (
  payout_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text,
  lesson_id uuid NOT NULL,
  amount integer NOT NULL,
  payment_intent_id text NOT NULL,
  creator_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                                                          |
| CREATE TABLE IF NOT EXISTS public.lesson_category (
  lesson_id uuid NOT NULL,
  category_id uuid NOT NULL,
  PRIMARY KEY (lesson_id, category_id)
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| CREATE TABLE IF NOT EXISTS public.lesson_request_votes (
  user_id uuid,
  request_id uuid,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  vote_type text,
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| CREATE TABLE IF NOT EXISTS public.lesson_requests (
  category text,
  vote_count integer DEFAULT 0,
  status text DEFAULT 'open'::text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  description text NOT NULL,
  title text NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  instagram_handle text,
  tags text[],
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                                                                                                       |
| CREATE TABLE IF NOT EXISTS public.lessons (
  title text NOT NULL,
  id uuid NOT NULL,
  description text,
  price numeric(19,4) NOT NULL,
  creator_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_product_id text,
  stripe_price_id text,
  content text,
  content_url text,
  thumbnail_url text,
  is_featured boolean NOT NULL DEFAULT false,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::lesson_status,
  deleted_at timestamp with time zone,
  version integer NOT NULL DEFAULT 1,
  mux_asset_id text,
  mux_playback_id text,
  video_processing_status text DEFAULT 'pending'::text,
  PRIMARY KEY (id)
); |
| CREATE TABLE IF NOT EXISTS public.profiles (
  full_name text NOT NULL,
  id uuid NOT NULL,
  stripe_account_details jsonb,
  stripe_account_status text,
  deleted_at timestamp with time zone,
  stripe_account_id text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  social_media_tag text,
  avatar_url text,
  bio text,
  email text NOT NULL,
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                         |
| CREATE TABLE IF NOT EXISTS public.purchases (
  status USER-DEFINED NOT NULL DEFAULT 'pending'::purchase_status,
  payment_intent_id text NOT NULL,
  creator_earnings numeric(19,4) NOT NULL,
  platform_fee numeric(19,4) NOT NULL,
  amount numeric(19,4) NOT NULL,
  stripe_session_id text NOT NULL,
  purchase_date timestamp with time zone NOT NULL DEFAULT now(),
  creator_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  user_id uuid NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb,
  fee_percentage numeric(5,2) NOT NULL,
  PRIMARY KEY (id)
);    |
| CREATE TABLE IF NOT EXISTS public.reviews (
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL,
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CREATE TABLE IF NOT EXISTS public.waitlist (
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  signed_up_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);                                                                                                                                                                                                                                                                                                                                                                                                                 |

7. Run the query and save the output - these are your CREATE TABLE statements

8. Create another query to generate foreign key constraints:

```sql
-- Generate ALTER TABLE statements for foreign keys
SELECT 
  'ALTER TABLE ' || 
  quote_ident(tc.table_schema) || '.' || quote_ident(tc.table_name) || 
  ' ADD CONSTRAINT ' || quote_ident(tc.constraint_name) || 
  ' FOREIGN KEY (' || string_agg(quote_ident(kcu.column_name), ', ') || 
  ') REFERENCES ' || 
  quote_ident(ccu.table_schema) || '.' || quote_ident(ccu.table_name) || 
  ' (' || string_agg(quote_ident(ccu.column_name), ', ') || 
  ');' AS add_foreign_key
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
  tc.constraint_type = 'FOREIGN KEY' AND
  tc.table_schema = 'public'
GROUP BY 
  tc.table_schema, 
  tc.table_name, 
  tc.constraint_name, 
  ccu.table_schema, 
  ccu.table_name
ORDER BY 
  tc.table_schema, 
  tc.table_name;
```

RESULT:
| add_foreign_key                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ALTER TABLE public.creator_earnings ADD CONSTRAINT creator_earnings_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles (id);           |
| ALTER TABLE public.creator_earnings ADD CONSTRAINT creator_earnings_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);              |
| ALTER TABLE public.creator_earnings ADD CONSTRAINT fk_creator_earnings_creator FOREIGN KEY (creator_id) REFERENCES public.profiles (id);                |
| ALTER TABLE public.creator_earnings ADD CONSTRAINT fk_creator_earnings_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                   |
| ALTER TABLE public.lesson_category ADD CONSTRAINT fk_lesson_category_category FOREIGN KEY (category_id) REFERENCES public.categories (id);              |
| ALTER TABLE public.lesson_category ADD CONSTRAINT fk_lesson_category_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                     |
| ALTER TABLE public.lesson_category ADD CONSTRAINT lesson_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id);         |
| ALTER TABLE public.lesson_category ADD CONSTRAINT lesson_category_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                |
| ALTER TABLE public.lesson_request_votes ADD CONSTRAINT fk_lesson_request_votes_request FOREIGN KEY (request_id) REFERENCES public.lesson_requests (id); |
| ALTER TABLE public.lesson_request_votes ADD CONSTRAINT fk_lesson_request_votes_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);              |
| ALTER TABLE public.lesson_request_votes ADD CONSTRAINT request_votes_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.lesson_requests (id);   |
| ALTER TABLE public.lesson_request_votes ADD CONSTRAINT request_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);                     |
| ALTER TABLE public.lesson_requests ADD CONSTRAINT fk_lesson_requests_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);                        |
| ALTER TABLE public.lesson_requests ADD CONSTRAINT lesson_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);                        |
| ALTER TABLE public.lessons ADD CONSTRAINT fk_lessons_creator FOREIGN KEY (creator_id) REFERENCES public.profiles (id);                                  |
| ALTER TABLE public.lessons ADD CONSTRAINT lessons_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles (id);                             |
| ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_creator FOREIGN KEY (creator_id) REFERENCES public.profiles (id);                              |
| ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                                 |
| ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);                                    |
| ALTER TABLE public.purchases ADD CONSTRAINT purchases_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles (id);                         |
| ALTER TABLE public.purchases ADD CONSTRAINT purchases_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                            |
| ALTER TABLE public.purchases ADD CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id);                               |
| ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                                     |
| ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);                                        |
| ALTER TABLE public.reviews ADD CONSTRAINT reviews_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);                                |
| ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id);                                   |

9. Run the query and save the output - these are your foreign key constraints

10. For each table you want to export data from, create a query like this (replace `table_name` with your actual table name):

```sql
-- Export data from table_name as INSERT statements
SELECT 
  'INSERT INTO public.' || quote_ident('table_name') || 
  '(' || 
  string_agg(quote_ident(column_name), ', ') || 
  ') VALUES ' ||
  string_agg(
    '(' || 
    string_agg(
      CASE
        WHEN value IS NULL THEN 'NULL'
        WHEN data_type IN ('character varying', 'text', 'varchar', 'char', 'date', 'timestamp', 'timestamptz', 'timestamp without time zone', 'timestamp with time zone', 'time', 'timetz', 'interval', 'uuid') 
          THEN '''' || replace(value::text, '''', '''''') || ''''
        WHEN data_type IN ('json', 'jsonb') 
          THEN 'cast(''' || replace(value::text, '''', '''''') || ''' as ' || data_type || ')'
        WHEN data_type = 'boolean' AND value::text = 't' THEN 'true'
        WHEN data_type = 'boolean' AND value::text = 'f' THEN 'false'
        ELSE value::text
      END,
      ', '
    ) || 
    ')',
    ', '
  ) || 
  ';' AS insert_statement
FROM (
  SELECT 
    c.column_name,
    c.data_type,
    (json_each_text(row_to_json(t))).value
  FROM 
    information_schema.columns c
  CROSS JOIN 
    public.table_name t
  WHERE 
    c.table_schema = 'public' AND 
    c.table_name = 'table_name'
) AS data
GROUP BY 
  table_name;
```
RESULT:
N/A

11. Run this for each important table and save the outputs - these are your INSERT statements

## Step 2: Clear and Rebuild Dev Database

1. Log in to your Supabase dashboard
2. Select your **dev** project
3. Navigate to the SQL Editor
4. Create a new query and paste the following SQL:

```sql
-- First, disable RLS temporarily to avoid permission issues
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND 
              EXISTS (
                  SELECT 1 FROM pg_policies 
                  WHERE tablename = r.tablename AND 
                        schemaname = 'public'
              )
    ) 
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Drop all existing tables in the public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant privileges back to postgres
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

5. Run the query to clear your dev database

6. Create a new query and paste all the CREATE TABLE statements you saved from Step 1
7. Run the query to recreate your table structure

8. Create a new query and paste all the INSERT statements you saved from Step 1
9. Run the query to populate your tables with data

10. Create a new query and paste all the foreign key constraint statements you saved from Step 1
11. Run the query to add back foreign key relationships

12. Finally, re-enable RLS with this query:

```sql
-- Re-enable RLS on all tables that had it before
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
```

## Step 3: Verify the Sync

Run these queries on both databases to verify they match:

```sql
-- Count rows in each table
SELECT 
  table_name, 
  (SELECT count(*) FROM public.table_name) AS row_count
FROM 
  information_schema.tables
WHERE 
  table_schema = 'public' AND 
  table_type = 'BASE TABLE'
ORDER BY 
  table_name;
```

## Important Notes

1. This process completely replaces your dev database with production data
2. Always back up your dev database before proceeding
3. For large tables, you may need to export/import in batches
4. You may need to recreate RLS policies if they differ between environments
5. This process doesn't handle storage buckets - those need separate handling
6. Sequences may need to be reset after import with:
   ```sql
   -- For each sequence in your database
   SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name));
   ```
7. If you have functions, triggers, or views, you'll need to export and import those separately

## Troubleshooting

If you encounter errors during the import process:

1. Check for circular dependencies in your foreign key constraints
2. Try importing data without foreign key constraints, then add them after
3. For large tables, try importing in smaller batches
4. If you get permission errors, check that RLS is properly disabled
