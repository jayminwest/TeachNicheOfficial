-- Enable Row Level Security on the lesson_requests table
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read lesson_requests
CREATE POLICY "Allow public read access for lesson_requests" 
ON lesson_requests
FOR SELECT 
USING (true);

-- If you also need to allow public access to related tables like lesson_request_votes
ALTER TABLE lesson_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for lesson_request_votes" 
ON lesson_request_votes
FOR SELECT 
USING (true);

-- Ensure authenticated users can still vote
CREATE POLICY "Allow authenticated users to vote" 
ON lesson_request_votes
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own votes
CREATE POLICY "Allow users to update their own votes" 
ON lesson_request_votes
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own votes
CREATE POLICY "Allow users to delete their own votes" 
ON lesson_request_votes
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
