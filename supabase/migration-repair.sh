#!/bin/bash

# First try to remove any existing entry for this migration
echo "Attempting to remove existing migration entry..."
supabase migration repair --status reverted 20250303000000
supabase migration repair --status reverted 20250303

# Then mark the migration as applied with the correct format
echo "Marking migration as applied..."
supabase migration repair --status applied 20250303000000

# Also handle the other migrations mentioned in the error
echo "Handling additional migrations..."
supabase migration repair --status applied 20250304010000
supabase migration repair --status applied 20250304020000
