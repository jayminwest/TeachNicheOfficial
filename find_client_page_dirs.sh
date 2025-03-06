#!/bin/bash

# Find all directories containing client.tsx
client_dirs=$(find . -name "client.tsx" -exec dirname {} \;)

# Check each directory to see if it also contains page.tsx
for dir in $client_dirs; do
  if [ -f "$dir/page.tsx" ]; then
    echo "$dir"
  fi
done
