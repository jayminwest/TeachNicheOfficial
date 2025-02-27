-- Add missing creator_applications table
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  expertise TEXT NOT NULL,
  experience TEXT NOT NULL,
  portfolio_url TEXT,
  social_links JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_applications_user_id ON creator_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_applications_status ON creator_applications(status);
