-- Step 1: Disable RLS temporarily to avoid permission issues
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

-- Step 2: Drop all existing tables in the public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Step 3: Grant privileges back to postgres
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Step 4: Create all tables
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.creator_earnings (
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
);

CREATE TABLE IF NOT EXISTS public.lesson_category (
  lesson_id uuid NOT NULL,
  category_id uuid NOT NULL,
  PRIMARY KEY (lesson_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_request_votes (
  user_id uuid,
  request_id uuid,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  vote_type text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.lesson_requests (
  category text,
  vote_count integer DEFAULT 0,
  status text DEFAULT 'open'::text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  description text NOT NULL,
  title text NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  instagram_handle text,
  tags ARRAY,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.lessons (
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
);

CREATE TABLE IF NOT EXISTS public.profiles (
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
);

CREATE TABLE IF NOT EXISTS public.purchases (
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
);

CREATE TABLE IF NOT EXISTS public.reviews (
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.waitlist (
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  signed_up_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Step 5: Create custom types if they don't exist
-- Check if lesson_status type exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_status') THEN
    CREATE TYPE lesson_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END$$;

-- Check if purchase_status type exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
    CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END$$;

-- Step 6: Add foreign key constraints
-- Note: Some constraints appear to be duplicates, but we'll include all for completeness
ALTER TABLE public.creator_earnings ADD CONSTRAINT creator_earnings_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles (id);
ALTER TABLE public.creator_earnings ADD CONSTRAINT creator_earnings_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);
ALTER TABLE public.creator_earnings ADD CONSTRAINT fk_creator_earnings_creator FOREIGN KEY (creator_id) REFERENCES public.profiles (id);
ALTER TABLE public.creator_earnings ADD CONSTRAINT fk_creator_earnings_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);

ALTER TABLE public.lesson_category ADD CONSTRAINT fk_lesson_category_category FOREIGN KEY (category_id) REFERENCES public.categories (id);
ALTER TABLE public.lesson_category ADD CONSTRAINT fk_lesson_category_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);
ALTER TABLE public.lesson_category ADD CONSTRAINT lesson_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id);
ALTER TABLE public.lesson_category ADD CONSTRAINT lesson_category_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);

ALTER TABLE public.lesson_request_votes ADD CONSTRAINT fk_lesson_request_votes_request FOREIGN KEY (request_id) REFERENCES public.lesson_requests (id);
ALTER TABLE public.lesson_request_votes ADD CONSTRAINT fk_lesson_request_votes_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);
ALTER TABLE public.lesson_request_votes ADD CONSTRAINT request_votes_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.lesson_requests (id);

-- This constraint references auth.users which might need special handling
-- ALTER TABLE public.lesson_request_votes ADD CONSTRAINT request_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);

ALTER TABLE public.lesson_requests ADD CONSTRAINT fk_lesson_requests_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);

-- This constraint references auth.users which might need special handling
-- ALTER TABLE public.lesson_requests ADD CONSTRAINT lesson_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);

ALTER TABLE public.lessons ADD CONSTRAINT fk_lessons_creator FOREIGN KEY (creator_id) REFERENCES public.profiles (id);
ALTER TABLE public.lessons ADD CONSTRAINT lessons_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles (id);

ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_creator FOREIGN KEY (creator_id) REFERENCES public.profiles (id);
ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);
ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles (id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id);

ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);
ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES public.profiles (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id);

-- Step 7: Export data from production and import to dev
-- You'll need to run the data export queries on production and then run the INSERT statements here
-- For each table, you should run a query like:
-- INSERT INTO public.table_name (column1, column2, ...) VALUES (...), (...), ...;

-- Step 8: Reset sequences if needed
-- For each sequence in your database that needs resetting:
-- SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name));

-- Step 9: Re-enable RLS
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

-- Step 10: Verify the sync by counting rows in each table
-- Run this on both production and dev to compare
SELECT 
  table_name, 
  (SELECT count(*) FROM information_schema.tables t2 WHERE t2.table_name = t.table_name) AS row_count
FROM 
  information_schema.tables t
WHERE 
  table_schema = 'public' AND 
  table_type = 'BASE TABLE'
ORDER BY 
  table_name;
