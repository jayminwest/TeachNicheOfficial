#!/bin/bash

# Script to help remove Supabase dependencies and references

echo "Checking for Supabase references in the codebase..."

# Create a directory for the results
mkdir -p migration-reports

# Find all files with Supabase references
echo "=== Files with Supabase imports ==="
grep -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "from ['\"].*supabase" . | tee migration-reports/supabase-imports.txt
echo ""

echo "=== Files with @supabase package imports ==="
grep -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "from ['\"]@supabase" . | tee migration-reports/supabase-package-imports.txt
echo ""

echo "=== Files with Supabase usage ==="
grep -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "supabase\." . | tee migration-reports/supabase-usage.txt
echo ""

echo "=== Files with Supabase types ==="
grep -l --include="*.ts" --include="*.tsx" "Supabase\|Database\|Tables" . | tee migration-reports/supabase-types.txt
echo ""

echo "=== Files with createClient ==="
grep -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "createClient" . | tee migration-reports/supabase-createclient.txt
echo ""

# Check for environment variables
echo "=== Environment variables related to Supabase ==="
grep -l "SUPABASE" .env* 2>/dev/null | tee migration-reports/supabase-env-vars.txt
echo ""

# Count total files to update
TOTAL_FILES=$(cat migration-reports/*.txt | sort | uniq | wc -l)
echo "Total files potentially needing updates: $TOTAL_FILES"
echo "Detailed reports saved in the migration-reports directory"

echo ""
echo "=== Next steps ==="
echo "1. Remove Supabase package dependencies:"
echo "   npm uninstall @supabase/supabase-js"
echo ""
echo "2. Update the following files:"
echo "   - Update auth-provider.ts to use FirebaseAuth instead of SupabaseAuth"
echo "   - Update any components that use Supabase directly"
echo "   - Update environment variables in .env files"
echo ""
echo "3. File operations:"
echo "   - Rename supabase-auth.ts to firebase-auth.ts"
echo "   - Remove app/lib/supabase.ts if it exists"
echo ""
echo "4. Update imports in files that reference Supabase"
echo ""
echo "5. Run the build to check for remaining issues:"
echo "   npm run build"
