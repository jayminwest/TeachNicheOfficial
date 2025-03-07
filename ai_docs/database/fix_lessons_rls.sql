-- Fix Lessons Table Row Level Security (RLS) Policies
-- This script cleans up redundant and conflicting policies and establishes clear access rules

-- 1. First, drop the conflicting and redundant policies
DROP POLICY IF EXISTS "Allow public read access for lessons" ON public.lessons;
DROP POLICY IF EXISTS "Anyone can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Lessons are visible to everyone" ON public.lessons;
DROP POLICY IF EXISTS "Users can view all their own lessons" ON public.lessons;

-- 2. Make sure RLS is enabled on the table
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 3. Create consolidated policies with clear, non-overlapping rules

-- Public access - unauthenticated users can only see published, non-deleted lessons
DROP POLICY IF EXISTS "Public can view published lessons" ON public.lessons;
CREATE POLICY "Public can view published lessons" 
ON public.lessons
FOR SELECT 
TO public
USING (status = 'published'::lesson_status AND deleted_at IS NULL);

-- Authenticated users can see their own lessons (any status) plus all published lessons
CREATE POLICY "Authenticated users can view their own and published lessons" 
ON public.lessons
FOR SELECT 
TO authenticated
USING ((auth.uid() = creator_id) OR (status = 'published'::lesson_status AND deleted_at IS NULL));

-- 4. Verify existing modification policies are correct
-- These look good from your current setup, but included here for completeness

-- Creators can update their own lessons
-- First drop if exists, then create
DROP POLICY IF EXISTS "Users can update their own lessons" ON public.lessons;
CREATE POLICY "Users can update their own lessons" 
ON public.lessons
FOR UPDATE 
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own lessons
DROP POLICY IF EXISTS "Users can delete their own lessons" ON public.lessons;
CREATE POLICY "Users can delete their own lessons" 
ON public.lessons
FOR DELETE 
TO authenticated
USING (auth.uid() = creator_id);

-- Creators can insert lessons with themselves as creator
DROP POLICY IF EXISTS "Users can create their own lessons" ON public.lessons;
CREATE POLICY "Users can create their own lessons" 
ON public.lessons
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Add a policy specifically for the service role to bypass RLS
DROP POLICY IF EXISTS "Service role has full access" ON public.lessons;
CREATE POLICY "Service role has full access"
ON public.lessons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Verify the policies after running this script with:
-- SELECT * FROM pg_policies WHERE tablename = 'lessons';

-- 6. If you're still having issues, you can check if the service role
-- is being used correctly in your application code:
-- 1. Make sure you're using the service role key, not the anon key
-- 2. Check that the Authorization header is being set correctly
-- 3. Verify that the service role client is being initialized properly
