#!/bin/bash

# Script to migrate existing documentation to the new structure
# Usage: ./migrate_docs.sh

# Create the directory structure if it doesn't exist
mkdir -p ai_docs/core
mkdir -p ai_docs/guides/development
mkdir -p ai_docs/guides/deployment
mkdir -p ai_docs/guides/maintenance
mkdir -p ai_docs/standards/code
mkdir -p ai_docs/standards/testing
mkdir -p ai_docs/standards/security
mkdir -p ai_docs/standards/documentation
mkdir -p ai_docs/processes/onboarding
mkdir -p ai_docs/processes/incident
mkdir -p ai_docs/processes/release
mkdir -p ai_docs/reference/apis
mkdir -p ai_docs/reference/data
mkdir -p ai_docs/reference/infrastructure
mkdir -p ai_docs/templates

# Move existing files to their new locations
# Example: mv ai_docs/old_file.md ai_docs/new_directory/NEW_NAME.md

# Move developer guidelines to standards
if [ -f ai_docs/DEVELOPER_GUIDELINES.md ]; then
  cp ai_docs/DEVELOPER_GUIDELINES.md ai_docs/standards/code/GUIDELINES.md
  echo "Moved DEVELOPER_GUIDELINES.md to standards/code/GUIDELINES.md"
fi

# Move any existing standards files
for file in ai_docs/standards/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename -- "$file")
    target_dir=""
    
    # Determine the appropriate target directory based on filename
    case "$filename" in
      *code*|*style*) target_dir="code" ;;
      *test*) target_dir="testing" ;;
      *security*|*auth*) target_dir="security" ;;
      *doc*) target_dir="documentation" ;;
      *) target_dir="" ;;
    esac
    
    if [ ! -z "$target_dir" ]; then
      new_name=$(echo "$filename" | tr '[:lower:]' '[:upper:]')
      cp "$file" "ai_docs/standards/$target_dir/$new_name"
      echo "Moved $filename to standards/$target_dir/$new_name"
    fi
  fi
done

echo "Migration complete. Please review the new structure and delete any redundant files."
