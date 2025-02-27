#!/bin/bash

# Configuration
BATCH_SIZE=8
MODEL="claude-3-5-sonnet"  # Change to your preferred model
AUDIT_TYPES="security, type safety, performance, best practices"
DIRS_TO_SCAN=("app/components" "app/services" "app/lib")
EXCLUDE_PATTERNS=(".test." ".spec." ".d.ts" "node_modules")
FILE_EXTENSIONS=(".ts" ".tsx" ".js" ".jsx")
RESULTS_DIR="audit-results"
TEMP_DIR="audit-temp"

# Create directories if they don't exist
mkdir -p "$RESULTS_DIR"
mkdir -p "$TEMP_DIR"

# Function to check if a file should be excluded
should_exclude() {
  local file="$1"
  
  # Check exclude patterns
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ "$file" == *"$pattern"* ]]; then
      return 0  # True, should exclude
    fi
  done
  
  # Check file extension
  local valid_extension=false
  for ext in "${FILE_EXTENSIONS[@]}"; do
    if [[ "$file" == *"$ext" ]]; then
      valid_extension=true
      break
    fi
  done
  
  if [ "$valid_extension" = false ]; then
    return 0  # True, should exclude
  fi
  
  return 1  # False, should not exclude
}

# Function to get all files to audit
get_files_to_audit() {
  local all_files=()
  
  for dir in "${DIRS_TO_SCAN[@]}"; do
    if [ ! -d "$dir" ]; then
      echo "Warning: Directory $dir does not exist, skipping."
      continue
    fi
    
    while IFS= read -r file; do
      if ! should_exclude "$file"; then
        all_files+=("$file")
      fi
    done < <(find "$dir" -type f)
  done
  
  echo "${all_files[@]}"
}

# Function to group files by directory (as a simple feature grouping)
group_files_by_feature() {
  local -n files=$1
  local groups=()
  local current_dir=""
  local current_group=()
  
  # Sort files by directory
  IFS=$'\n' sorted_files=($(sort <<<"${files[*]}"))
  unset IFS
  
  for file in "${sorted_files[@]}"; do
    dir=$(dirname "$file")
    
    if [[ "$dir" != "$current_dir" && ${#current_group[@]} -gt 0 ]]; then
      # Store the current group and start a new one
      groups+=("${current_group[*]}")
      current_group=()
    fi
    
    current_dir="$dir"
    current_group+=("$file")
  done
  
  # Add the last group if not empty
  if [ ${#current_group[@]} -gt 0 ]; then
    groups+=("${current_group[*]}")
  fi
  
  echo "${groups[@]}"
}

# Function to create audit instructions file
create_audit_instructions() {
  local batch=($1)
  local audit_file="$2"
  
  echo "# Code Audit Instructions" > "$audit_file"
  echo "" >> "$audit_file"
  echo "Please audit these files for $AUDIT_TYPES issues:" >> "$audit_file"
  echo "" >> "$audit_file"
  echo "Focus on:" >> "$audit_file"
  echo "- Security vulnerabilities" >> "$audit_file"
  echo "- Type safety problems" >> "$audit_file"
  echo "- Performance bottlenecks" >> "$audit_file"
  echo "- Code quality and best practices" >> "$audit_file"
  echo "" >> "$audit_file"
  echo "Files to audit:" >> "$audit_file"
  for file in "${batch[@]}"; do
    echo "- $file" >> "$audit_file"
  done
  echo "" >> "$audit_file"
  echo "Provide specific recommendations for each issue found." >> "$audit_file"
}

# Function to add AI comments to files
add_audit_comments() {
  local batch=($1)
  
  # Add regular AI comments to all files except the last one
  for ((i=0; i<${#batch[@]}-1; i++)); do
    file="${batch[$i]}"
    temp_file="${TEMP_DIR}/$(basename "$file").tmp"
    
    echo "// Audit this file for $AUDIT_TYPES. AI" > "$temp_file"
    cat "$file" >> "$temp_file"
    mv "$temp_file" "$file"
    echo "Added audit comment to $file"
  done
  
  # Add the triggering AI! comment to the last file
  last_file="${batch[${#batch[@]}-1]}"
  temp_file="${TEMP_DIR}/$(basename "$last_file").tmp"
  
  echo "// Audit all these files together and look for cross-file issues. AI!" > "$temp_file"
  cat "$last_file" >> "$temp_file"
  mv "$temp_file" "$last_file"
  echo "Added trigger comment to $last_file"
}

# Function to remove audit comments
remove_audit_comments() {
  local batch=($1)
  
  for file in "${batch[@]}"; do
    if [ -f "$file" ]; then
      temp_file="${TEMP_DIR}/$(basename "$file").tmp"
      
      # Check if the first line contains an AI comment
      first_line=$(head -n 1 "$file")
      if [[ "$first_line" == *"AI"* ]]; then
        tail -n +2 "$file" > "$temp_file"
        mv "$temp_file" "$file"
        echo "Removed audit comment from $file"
      fi
    fi
  done
}

# Main function for command-line mode
run_cli_mode() {
  echo "Running in CLI mode (direct aider invocation)"
  
  # Get all files to audit
  IFS=' ' read -ra all_files <<< "$(get_files_to_audit)"
  echo "Found ${#all_files[@]} files to audit"
  
  # Group files by feature
  IFS=' ' read -ra file_groups <<< "$(group_files_by_feature all_files)"
  echo "Grouped into ${#file_groups[@]} feature groups"
  
  # Process each group in batches
  group_count=1
  for group in "${file_groups[@]}"; do
    IFS=' ' read -ra group_files <<< "$group"
    echo "Processing group $group_count/${#file_groups[@]} with ${#group_files[@]} files"
    
    # Process in batches
    for ((i=0; i<${#group_files[@]}; i+=BATCH_SIZE)); do
      # Get current batch
      batch=()
      for ((j=i; j<i+BATCH_SIZE && j<${#group_files[@]}; j++)); do
        batch+=("${group_files[$j]}")
      done
      
      batch_num=$((i/BATCH_SIZE+1))
      echo "Auditing batch $batch_num, files: ${batch[*]}"
      
      # Create a temporary file with audit instructions
      audit_file="${TEMP_DIR}/audit_instructions_${group_count}_${batch_num}.md"
      create_audit_instructions "${batch[*]}" "$audit_file"
      
      # Create results file
      results_file="${RESULTS_DIR}/audit_results_group${group_count}_batch${batch_num}.txt"
      
      # Run aider with the batch of files
      echo "Running aider on batch $batch_num..."
      aider --model "$MODEL" "$audit_file" "${batch[@]}" > "$results_file" 2>&1
      
      echo "Audit results saved to $results_file"
      echo "Waiting 5 seconds before next batch..."
      sleep 5
    done
    
    group_count=$((group_count+1))
  done
  
  echo "Audit complete. Results saved in $RESULTS_DIR directory."
}

# Main function for watch mode
run_watch_mode() {
  echo "Running in watch mode (using AI comments)"
  
  # Get all files to audit
  IFS=' ' read -ra all_files <<< "$(get_files_to_audit)"
  echo "Found ${#all_files[@]} files to audit"
  
  # Group files by feature
  IFS=' ' read -ra file_groups <<< "$(group_files_by_feature all_files)"
  echo "Grouped into ${#file_groups[@]} feature groups"
  
  # Start aider in watch mode in the background
  echo "Starting aider in watch mode..."
  aider --watch-files --model "$MODEL" &
  AIDER_PID=$!
  
  # Give aider time to start up
  echo "Waiting for aider to start..."
  sleep 5
  
  # Process each group in batches
  group_count=1
  for group in "${file_groups[@]}"; do
    IFS=' ' read -ra group_files <<< "$group"
    echo "Processing group $group_count/${#file_groups[@]} with ${#group_files[@]} files"
    
    # Process in batches
    for ((i=0; i<${#group_files[@]}; i+=BATCH_SIZE)); do
      # Get current batch
      batch=()
      for ((j=i; j<i+BATCH_SIZE && j<${#group_files[@]}; j++)); do
        batch+=("${group_files[$j]}")
      done
      
      batch_num=$((i/BATCH_SIZE+1))
      echo "Auditing batch $batch_num, files: ${batch[*]}"
      
      # Add audit comments to trigger aider
      add_audit_comments "${batch[*]}"
      
      # Wait for aider to process (adjust time based on complexity)
      echo "Waiting for aider to process (60 seconds)..."
      sleep 60
      
      # Clean up by removing the audit comments
      remove_audit_comments "${batch[*]}"
      
      # Wait between batches
      echo "Waiting 5 seconds before next batch..."
      sleep 5
    done
    
    group_count=$((group_count+1))
  done
  
  # Terminate aider process when done
  echo "Audit complete. Terminating aider..."
  kill $AIDER_PID
}

# Display usage information
show_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --cli-mode       Run in CLI mode (direct aider invocation)"
  echo "  --watch-mode     Run in watch mode (using AI comments)"
  echo "  --batch-size N   Set batch size (default: $BATCH_SIZE)"
  echo "  --model MODEL    Set the model to use (default: $MODEL)"
  echo "  --dirs DIRS      Comma-separated list of directories to scan"
  echo "  --help           Display this help message"
  echo ""
  echo "Example:"
  echo "  $0 --cli-mode --batch-size 5 --model claude-3-5-sonnet --dirs app/components,app/lib"
}

# Parse command line arguments
MODE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --cli-mode)
      MODE="cli"
      shift
      ;;
    --watch-mode)
      MODE="watch"
      shift
      ;;
    --batch-size)
      BATCH_SIZE="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --dirs)
      IFS=',' read -ra DIRS_TO_SCAN <<< "$2"
      shift 2
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Check if a mode was specified
if [ -z "$MODE" ]; then
  echo "Error: You must specify either --cli-mode or --watch-mode"
  show_usage
  exit 1
fi

# Run the appropriate mode
if [ "$MODE" = "cli" ]; then
  run_cli_mode
elif [ "$MODE" = "watch" ]; then
  run_watch_mode
fi

echo "Script completed successfully."
