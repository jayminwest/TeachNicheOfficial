-- This migration resolves conflicts with previously applied migrations
-- It contains any necessary changes that weren't applied due to the conflict

-- This migration consolidates the necessary changes from the conflicting migrations
-- while ensuring the schema is in the correct state

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
  END IF;
END
$$;

-- Create a marker to indicate this migration has been applied
COMMENT ON DATABASE postgres IS 'Migration 20250310000000_fix_migration_conflict applied';
