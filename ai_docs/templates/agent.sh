#!/bin/bash

# Get the prompt from command line arguments
PROMPT="$*"

if [ -z "$PROMPT" ]; then
  echo "Usage: $0 <prompt>"
  echo "Please provide a prompt as an argument."
  exit 1
fi

echo "Working with prompt: $PROMPT"
echo "Loading template files..."

# Open all files in the templates directory as editable
for file in $(find "$(dirname "$0")" -name "*.md"); do
  echo "Loading: $file"
  echo "/edit $file"
done

echo "All template files loaded. Ready to process your prompt: $PROMPT"
