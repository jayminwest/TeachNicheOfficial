-- Enable Row Level Security on tables
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_request_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson_requests table
-- Allow anyone to read requests
CREATE POLICY "Allow anyone to read requests"
  ON lesson_requests
  FOR SELECT
  USING (true);

-- Allow authenticated users to create requests
CREATE POLICY "Allow authenticated users to create requests"
  ON lesson_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own requests
CREATE POLICY "Allow users to update their own requests"
  ON lesson_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own requests
CREATE POLICY "Allow users to delete their own requests"
  ON lesson_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for lesson_request_votes table
-- Allow anyone to read votes
CREATE POLICY "Allow anyone to read votes"
  ON lesson_request_votes
  FOR SELECT
  USING (true);

-- Allow authenticated users to create votes
CREATE POLICY "Allow authenticated users to create votes"
  ON lesson_request_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own votes
CREATE POLICY "Allow users to delete their own votes"
  ON lesson_request_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate votes
ALTER TABLE lesson_request_votes
  ADD CONSTRAINT unique_user_request_vote
  UNIQUE (user_id, request_id);

-- Create functions for atomic vote count updates
CREATE OR REPLACE FUNCTION increment_vote_count(request_id UUID)
RETURNS SETOF lesson_requests AS $$
BEGIN
  RETURN QUERY
  UPDATE lesson_requests
  SET vote_count = vote_count + 1
  WHERE id = request_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_vote_count(request_id UUID)
RETURNS SETOF lesson_requests AS $$
BEGIN
  RETURN QUERY
  UPDATE lesson_requests
  SET vote_count = GREATEST(0, vote_count - 1)
  WHERE id = request_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting function for requests
CREATE OR REPLACE FUNCTION check_request_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count requests in the last hour from this user
  SELECT COUNT(*) INTO recent_count
  FROM lesson_requests
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- If more than 5 requests in the last hour, reject
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 5 requests per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting
CREATE TRIGGER enforce_request_rate_limit
BEFORE INSERT ON lesson_requests
FOR EACH ROW
EXECUTE FUNCTION check_request_rate_limit();

-- Create rate limiting function for votes
CREATE OR REPLACE FUNCTION check_vote_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count votes in the last hour from this user
  SELECT COUNT(*) INTO recent_count
  FROM lesson_request_votes
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- If more than 20 votes in the last hour, reject
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 20 votes per hour';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote rate limiting
CREATE TRIGGER enforce_vote_rate_limit
BEFORE INSERT ON lesson_request_votes
FOR EACH ROW
EXECUTE FUNCTION check_vote_rate_limit();

-- Add created_at column to lesson_request_votes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'lesson_request_votes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE lesson_request_votes ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
