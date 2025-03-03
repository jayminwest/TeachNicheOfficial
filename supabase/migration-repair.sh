#!/bin/bash

# First try to remove any existing entries for these migrations
echo "Attempting to remove existing migration entries..."
supabase migration repair --status reverted 20250303000000
supabase migration repair --status reverted 20250303
supabase migration repair --status reverted 20250304010000
supabase migration repair --status reverted 20250304020000

# Then mark the migrations as applied with the correct format
echo "Marking migrations as applied..."
supabase migration repair --status applied 20250303000000

# Run db pull to verify the changes
echo "Pulling database schema..."
supabase db pull
