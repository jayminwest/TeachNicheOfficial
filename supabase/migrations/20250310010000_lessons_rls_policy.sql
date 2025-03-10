-- Migration: 20250310010000
-- Add RLS policies for lessons table

-- Enable RLS on lessons table if not already enabled
ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;

-- Create policy for creators to manage their own lessons
CREATE POLICY IF NOT EXISTS "Creators can manage their own lessons"
  ON public.lessons
  FOR ALL
  USING (auth.uid() = creator_id);

-- Create policy for users to view published lessons
CREATE POLICY IF NOT EXISTS "Users can view published lessons"
  ON public.lessons
  FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);

-- Create policy for admins to manage all lessons
CREATE POLICY IF NOT EXISTS "Admins can manage all lessons"
  ON public.lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND raw_app_meta_data->>'role' = 'admin'
    )
  );
