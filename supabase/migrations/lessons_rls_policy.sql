-- Enable Row Level Security on lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select any lesson (for public viewing)
CREATE POLICY "Anyone can view published lessons" 
ON lessons FOR SELECT 
USING (status = 'published' AND deleted_at IS NULL);

-- Create policy to allow authenticated users to create their own lessons
CREATE POLICY "Users can create their own lessons" 
ON lessons FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Create policy to allow users to update their own lessons
CREATE POLICY "Users can update their own lessons" 
ON lessons FOR UPDATE 
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Create policy to allow users to delete their own lessons
-- Note: In practice, you might want to use soft deletes by updating deleted_at
CREATE POLICY "Users can delete their own lessons" 
ON lessons FOR DELETE 
TO authenticated
USING (auth.uid() = creator_id);

-- Create policy to allow users to view all their own lessons (including drafts)
CREATE POLICY "Users can view all their own lessons" 
ON lessons FOR SELECT 
TO authenticated
USING (auth.uid() = creator_id);

-- Create policy to allow admins to manage all lessons (optional)
-- Uncomment and modify if you have admin roles
-- CREATE POLICY "Admins can manage all lessons" 
-- ON lessons FOR ALL 
-- TO authenticated
-- USING (auth.uid() IN (SELECT user_id FROM admins));
