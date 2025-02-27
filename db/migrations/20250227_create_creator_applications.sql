-- Create creator_applications table
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  motivation TEXT NOT NULL,
  sample_lesson_title VARCHAR(255) NOT NULL,
  sample_lesson_content TEXT NOT NULL,
  teaching_approach TEXT NOT NULL,
  instagram_handle VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS creator_applications_user_id_idx ON creator_applications(user_id);
CREATE INDEX IF NOT EXISTS creator_applications_status_idx ON creator_applications(status);
