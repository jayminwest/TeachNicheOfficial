#!/bin/bash

# Script to update environment variables from Supabase to Firebase

echo "Updating environment variables from Supabase to Firebase..."

# Function to update a specific .env file
update_env_file() {
  local file=$1
  
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Create a backup
    cp "$file" "${file}.bak"
    
    # Replace Supabase variables with Firebase equivalents
    sed -i.tmp \
      -e 's/^NEXT_PUBLIC_SUPABASE_URL=.*/# NEXT_PUBLIC_SUPABASE_URL has been replaced with Firebase config/' \
      -e 's/^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/# NEXT_PUBLIC_SUPABASE_ANON_KEY has been replaced with Firebase config/' \
      -e 's/^SUPABASE_SERVICE_ROLE_KEY=.*/# SUPABASE_SERVICE_ROLE_KEY has been replaced with Firebase admin SDK/' \
      "$file"
    
    # Add Firebase variables if they don't exist
    if ! grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" "$file"; then
      echo "" >> "$file"
      echo "# Firebase Configuration" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_API_KEY=" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=teachnicheofficial" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_APP_ID=" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=" >> "$file"
      echo "" >> "$file"
      echo "# Set to 'true' to use Firebase emulators in development" >> "$file"
      echo "NEXT_PUBLIC_FIREBASE_USE_EMULATORS=false" >> "$file"
    fi
    
    # Remove temporary files
    rm -f "${file}.tmp"
    
    echo "Updated $file (backup saved as ${file}.bak)"
  else
    echo "File $file not found, skipping."
  fi
}

# Update all environment files
update_env_file ".env"
update_env_file ".env.local"
update_env_file ".env.development"
update_env_file ".env.test"
update_env_file ".env.production"

echo ""
echo "Environment variables updated. Please fill in the Firebase configuration values."
echo "You can get these values from the Firebase console: https://console.firebase.google.com/project/teachnicheofficial/settings/general/"
