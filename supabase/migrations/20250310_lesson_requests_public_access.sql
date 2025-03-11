-- Enable Row Level Security on the lesson_requests table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'lesson_requests' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create a policy that allows anyone to read lesson_requests if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lesson_requests' 
        AND policyname = 'Allow public read access for lesson_requests'
    ) THEN
        CREATE POLICY "Allow public read access for lesson_requests" 
        ON lesson_requests
        FOR SELECT 
        USING (true);
    END IF;
END
$$;

-- Enable Row Level Security on lesson_request_votes if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'lesson_request_votes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE lesson_request_votes ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create policies for lesson_request_votes if they don't exist
DO $$
BEGIN
    -- Policy for public read access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lesson_request_votes' 
        AND policyname = 'Allow public read access for lesson_request_votes'
    ) THEN
        CREATE POLICY "Allow public read access for lesson_request_votes" 
        ON lesson_request_votes
        FOR SELECT 
        USING (true);
    END IF;

    -- Policy for authenticated users to vote
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lesson_request_votes' 
        AND policyname = 'Allow authenticated users to vote'
    ) THEN
        CREATE POLICY "Allow authenticated users to vote" 
        ON lesson_request_votes
        FOR INSERT 
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy for users to update their own votes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lesson_request_votes' 
        AND policyname = 'Allow users to update their own votes'
    ) THEN
        CREATE POLICY "Allow users to update their own votes" 
        ON lesson_request_votes
        FOR UPDATE 
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- Policy for users to delete their own votes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lesson_request_votes' 
        AND policyname = 'Allow users to delete their own votes'
    ) THEN
        CREATE POLICY "Allow users to delete their own votes" 
        ON lesson_request_votes
        FOR DELETE 
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END
$$;
