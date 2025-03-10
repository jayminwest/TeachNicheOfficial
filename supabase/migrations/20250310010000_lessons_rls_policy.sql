-- Migration: 20250310010000
-- Add RLS policies for lessons table

-- Check if lessons table exists before applying policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons'
  ) THEN
    -- Enable RLS on lessons table if not already enabled
    ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

    -- Create policy for creators to manage their own lessons if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Creators can manage their own lessons'
      AND tablename = 'lessons'
    ) THEN
      CREATE POLICY "Creators can manage their own lessons"
        ON public.lessons
        FOR ALL
        USING (auth.uid() = creator_id);
    END IF;

    -- Create policy for users to view published lessons if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Users can view published lessons'
      AND tablename = 'lessons'
    ) THEN
      CREATE POLICY "Users can view published lessons"
        ON public.lessons
        FOR SELECT
        USING (status = 'published' AND deleted_at IS NULL);
    END IF;

    -- Create policy for admins to manage all lessons if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Admins can manage all lessons'
      AND tablename = 'lessons'
    ) THEN
      CREATE POLICY "Admins can manage all lessons"
        ON public.lessons
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id AND raw_app_meta_data->>'role' = 'admin'
          )
        );
    END IF;
  END IF;
END
$$;
