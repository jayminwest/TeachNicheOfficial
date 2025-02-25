#!/bin/bash

# Get the prompt from command line arguments
PROMPT="$*"

if [ -z "$PROMPT" ]; then
  echo "Usage: $0 <prompt>"
  echo "Please provide a prompt as an argument."
  exit 1
fi

# Get the directory of this script
DIR="$(dirname "$0")"

# Find all markdown files in the directory
FILES=$(find "$DIR" -name "*.md")

# Launch aider with the files and the prompt
aider --message "$PROMPT" $FILES
