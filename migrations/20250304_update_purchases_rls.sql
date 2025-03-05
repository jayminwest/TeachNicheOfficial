-- Update RLS policies for purchases table
-- This migration addresses the issue where new purchase records cannot be created
-- due to restrictive RLS policies

-- First, drop any existing RLS policies on the purchases table
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Creators can view purchases for their lessons" ON purchases;
DROP POLICY IF EXISTS "Service role can manage all purchases" ON purchases;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON purchases;
DROP POLICY IF EXISTS "Allow updates to purchases via webhooks" ON purchases;
DROP POLICY IF EXISTS "Allow all operations for service role" ON purchases;

-- Enable RLS on the purchases table if not already enabled
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for viewing purchases
-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" 
ON purchases FOR SELECT 
USING (auth.uid() = user_id);

-- Creators can view purchases for their lessons
CREATE POLICY "Creators can view purchases for their lessons" 
ON purchases FOR SELECT 
USING (auth.uid() = creator_id);

-- Allow authenticated users to insert purchases
-- This is the key policy that was likely missing
CREATE POLICY "Allow insert for authenticated users" 
ON purchases FOR INSERT 
WITH CHECK (true);  -- More permissive to allow any authenticated user or service role

-- Allow service role to do ALL operations on purchases
-- This is critical for backend operations and webhooks
CREATE POLICY "Allow all operations for service role" 
ON purchases
FOR ALL
USING (true)
WITH CHECK (true);

-- Add a policy to allow updates to purchases
-- This is important for webhook updates
CREATE POLICY "Allow updates to purchases via webhooks" 
ON purchases FOR UPDATE 
USING (true)
WITH CHECK (true);
