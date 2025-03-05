#!/bin/bash

echo "Removing unused files and functions..."

# Remove unused components
rm -f ./app/components/ui/manual-publish-button.tsx
rm -f ./app/components/ui/auth-redirect.tsx

# Remove unused hooks
rm -f ./app/hooks/use-auth-guard.ts

echo "Unused files removed successfully."
