#!/bin/bash

echo "=== Finding files importing Supabase packages ==="
grep -r "from '@supabase" --include="*.test.tsx" --include="*.test.ts" .

echo -e "\n=== Finding files using Supabase client ==="
grep -r "supabase\." --include="*.test.tsx" --include="*.test.ts" .

echo -e "\n=== Finding files mocking Supabase ==="
grep -r "mock.*supabase" --include="*.test.tsx" --include="*.test.ts" .

echo -e "\n=== Finding files importing auth-helpers-nextjs ==="
grep -r "@supabase/auth-helpers-nextjs" --include="*.test.tsx" --include="*.test.ts" .

echo -e "\n=== Finding files with createClient ==="
grep -r "createClient" --include="*.test.tsx" --include="*.test.ts" .

echo -e "\n=== Finding test files that might need updating ==="
find . -name "*.test.ts" -o -name "*.test.tsx" | sort
