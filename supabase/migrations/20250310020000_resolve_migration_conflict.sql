-- Migration: 20250310020000_resolve_migration_conflict
-- This migration resolves conflicts with previously applied migrations
-- by consolidating necessary changes and skipping duplicate operations

-- Check if the profiles table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT,
      bio TEXT,
      social_media_tag TEXT,
      email TEXT,
      stripe_account_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      avatar_url TEXT,
      deleted_at TIMESTAMP WITH TIME ZONE,
      stripe_account_status TEXT,
      stripe_account_details JSONB
    );
  END IF;
END
$$;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the create_profile function
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  user_full_name TEXT,
  user_bio TEXT DEFAULT '',
  user_social_media TEXT DEFAULT '',
  user_email TEXT DEFAULT ''
) RETURNS VOID AS $$
BEGIN
  -- Insert the profile if it doesn't exist
  INSERT INTO profiles (id, full_name, bio, social_media_tag, email)
  VALUES (
    user_id,
    user_full_name,
    user_bio,
    user_social_media,
    user_email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    social_media_tag = EXCLUDED.social_media_tag,
    email = EXCLUDED.email,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_profile TO authenticated;

-- Enable RLS on the profiles table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Check if select policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'select_own_profile'
  ) THEN
    CREATE POLICY select_own_profile ON profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  -- Check if insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'insert_own_profile'
  ) THEN
    CREATE POLICY insert_own_profile ON profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
  
  -- Check if update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'update_own_profile'
  ) THEN
    CREATE POLICY update_own_profile ON profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Create a trigger for profile creation if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Check if lessons table exists before applying RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons'
  ) THEN
    -- Enable RLS on lessons table if not already enabled
    ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

    -- Create policy for creators to manage their own lessons
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

    -- Create policy for users to view published lessons
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
    
    -- Create policy for admins to manage all lessons
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

-- Create a marker to indicate this migration has been applied
COMMENT ON DATABASE postgres IS 'Migration 20250310020000_resolve_migration_conflict applied';
