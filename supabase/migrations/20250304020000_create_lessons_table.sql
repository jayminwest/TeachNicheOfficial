-- Migration: 20250304020000
-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_asset_id TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to view published lessons
CREATE POLICY select_lessons ON lessons
  FOR SELECT
  USING (true);

-- Create a policy to allow instructors to insert their own lessons
CREATE POLICY insert_own_lessons ON lessons
  FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

-- Create a policy to allow instructors to update their own lessons
CREATE POLICY update_own_lessons ON lessons
  FOR UPDATE
  USING (auth.uid() = instructor_id);
