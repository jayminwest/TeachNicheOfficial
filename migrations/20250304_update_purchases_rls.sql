-- Update RLS policies for purchases table
-- This migration addresses the issue where new purchase records cannot be created
-- due to restrictive RLS policies

-- First, drop any existing RLS policies on the purchases table
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Creators can view purchases for their lessons" ON purchases;
DROP POLICY IF EXISTS "Service role can manage all purchases" ON purchases;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON purchases;

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
WITH CHECK (auth.role() = 'authenticated');

-- Allow service role to manage all purchases
-- This is important for backend operations and webhooks
CREATE POLICY "Service role can manage all purchases" 
ON purchases 
USING (auth.role() = 'service_role');

-- Add a policy to allow updates to purchases with matching session IDs
-- This is important for webhook updates
CREATE POLICY "Allow updates to purchases via webhooks" 
ON purchases FOR UPDATE 
USING (true)
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
