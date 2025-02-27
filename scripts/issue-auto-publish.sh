#!/bin/bash

#!/bin/bash

# Script to automatically publish new issue files to GitHub
# and update the file with the actual issue number

# Configuration
ISSUES_DIR="ai_docs/issues"
ISSUE_PATTERN="[0-9]{4}-[0-9]{2}-[0-9]{2}-([0-9]{3})-.*\.md"
LOCK_FILE="/tmp/issue_publisher.lock"

# Exit if another instance is running
if [ -f "$LOCK_FILE" ]; then
  # Check if the process is still running
  if ps -p $(cat "$LOCK_FILE") > /dev/null 2>&1; then
    echo "Another instance is already running. Exiting."
    exit 1
  else
    # Lock file exists but process is not running, remove stale lock
    rm -f "$LOCK_FILE"
  fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"

# Cleanup function to remove lock file on exit
cleanup() {
  rm -f "$LOCK_FILE"
  echo "Lock file removed."
}

# Set trap to ensure cleanup on script exit
trap cleanup EXIT

# Function to create GitHub issue from file
create_github_issue() {
  local file_path="$1"
  local issue_title=$(head -n 1 "$file_path" | sed 's/^# //')
  
  echo "Creating GitHub issue for: $issue_title"
  
  # Create the issue using GitHub CLI and capture the response
  issue_response=$(gh issue create --title "$issue_title" --body-file "$file_path")
  
  # Extract the issue number from the response
  # The response is typically a URL like https://github.com/user/repo/issues/42
  issue_number=$(echo "$issue_response" | grep -oE '/issues/([0-9]+)' | cut -d'/' -f3)
  
  if [ -n "$issue_number" ]; then
    echo "Created issue #$issue_number"
    
    # Extract the current issue number from the filename
    current_number=$(echo "$file_path" | grep -oE "$ISSUE_PATTERN" | cut -d'-' -f4)
    
    if [ "$current_number" != "$issue_number" ]; then
      # Create new filename with correct issue number
      new_filename=$(echo "$file_path" | sed "s/-$current_number-/-$(printf "%03d" $issue_number)-/")
      
      echo "Renaming file to match actual issue number:"
      echo "  From: $file_path"
      echo "  To:   $new_filename"
      
      # Rename the file
      mv "$file_path" "$new_filename"
      
      # Add and commit the renamed file
      git add "$new_filename"
      if [ -f "$file_path" ]; then
        git rm "$file_path"
      fi
      git commit -m "chore: Update issue filename to match GitHub issue #$issue_number"
    fi
  else
    echo "Failed to extract issue number from response: $issue_response"
  fi
}

# Main script execution

# Check if the issues directory exists
if [ ! -d "$ISSUES_DIR" ]; then
  echo "Issues directory not found: $ISSUES_DIR"
  rm -f "$LOCK_FILE"
  exit 1
fi

# Check for new issue files that haven't been published yet
# This assumes files are named with a pattern like YYYY-MM-DD-NNN-issue-name.md
# where NNN is a placeholder issue number

echo "Checking for new issue files in $ISSUES_DIR..."

# Use find to locate files matching our pattern
find "$ISSUES_DIR" -type f -name "*.md" | while read -r file; do
  # Check if this file has already been processed (by looking for GitHub issue URL in content)
  if ! grep -q "github.com/.*/issues/[0-9]" "$file"; then
    # This file doesn't have a GitHub issue reference, so it's likely new
    create_github_issue "$file"
  fi
done

echo "Issue processing complete."
