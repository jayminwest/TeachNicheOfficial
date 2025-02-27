#!/bin/bash

# Script to help remove Supabase dependencies and references

echo "Checking for Supabase references in the codebase..."

# Find all files with Supabase references
echo "Files with Supabase imports:"
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "from '@/app/lib/supabase'" .

echo "Files with Supabase usage:"
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "supabase\." .

echo "Files with Supabase types:"
grep -r --include="*.ts" --include="*.tsx" "Supabase" .

echo ""
echo "To remove Supabase package dependencies, run:"
echo "npm uninstall @supabase/supabase-js"

echo ""
echo "Remember to update the following files:"
echo "1. Update auth-provider.ts to use FirebaseAuth instead of SupabaseAuth"
echo "2. Update any components that use Supabase directly"
echo "3. Update environment variables in .env files"

echo ""
echo "Don't forget to rename supabase-auth.ts to firebase-auth.ts for clarity"
