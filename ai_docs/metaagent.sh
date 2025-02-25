#!/bin/bash

# Default mode is read-only
MODE="read-only"

# Process flags
while [[ "$1" == --* ]]; do
  case "$1" in
    --read-only)
      MODE="read-only"
      shift
      ;;
    --editable)
      MODE="editable"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--read-only|--editable] <prompt>"
      exit 1
      ;;
  esac
done

# Get the prompt from command line arguments
PROMPT="$*"

if [ -z "$PROMPT" ]; then
  echo "Usage: $0 [--read-only|--editable] <prompt>"
  echo "Please provide a prompt as an argument."
  exit 1
fi

# Get the directory of this script
DIR="$(dirname "$0")"

# Find all markdown files in all subdirectories
FILES=$(find "$DIR" -name "*.md")

# Launch aider with the files and the prompt
if [ "$MODE" = "read-only" ]; then
  # Read-only mode: add files as read-only
  AIDER_FILES=""
  for file in $FILES; do
    AIDER_FILES="$AIDER_FILES --read $file"
  done
  aider --model ollama/deepseek-r1:70b --message "$PROMPT" $AIDER_FILES
else
  # Editable mode: add files as editable
  aider --model ollama/deepseek-r1:70b --message "$PROMPT" $FILES
fi
