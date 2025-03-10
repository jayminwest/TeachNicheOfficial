-- Migration: 20250303000000
-- Create a function to handle new user creation and profile setup
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

-- Create a function to safely create profiles with proper permissions
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

-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to select their own profile
CREATE POLICY select_own_profile ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create a policy to allow users to insert their own profile
CREATE POLICY insert_own_profile ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a policy to allow users to update their own profile
CREATE POLICY update_own_profile ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
