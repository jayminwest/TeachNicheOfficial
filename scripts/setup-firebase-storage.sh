#!/bin/bash
# Script to guide through Firebase Storage setup

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}Firebase Storage Setup Guide${NC}"
echo "This script will guide you through setting up Firebase Storage for the Teach Niche project."
echo

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI not found!${NC}"
    echo "Please install Firebase CLI first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
echo "Checking Firebase login status..."
firebase login:list &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to log in to Firebase first.${NC}"
    echo "Running 'firebase login'..."
    firebase login
fi

# Check if project is selected
echo "Checking Firebase project configuration..."
PROJECT_ID=$(firebase projects:list --json | grep -o '"projectId": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}No Firebase project selected.${NC}"
    echo "Please select a project:"
    firebase projects:list
    echo
    read -p "Enter the project ID (e.g., teachnicheofficial): " PROJECT_ID
    firebase use $PROJECT_ID
else
    echo -e "Current Firebase project: ${GREEN}$PROJECT_ID${NC}"
fi

echo
echo -e "${BOLD}Firebase Storage Setup Steps:${NC}"
echo "1. Go to Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID/storage"
echo "2. Click 'Get Started' to create a default storage bucket"
echo "3. Select region 'us-central' to match Firestore database region"
echo "4. Choose production mode with secure rules"
echo "5. Wait for bucket creation to complete"
echo

read -p "Have you completed steps 1-5? (y/n): " STORAGE_CREATED

if [ "$STORAGE_CREATED" != "y" ]; then
    echo -e "${YELLOW}Please complete the storage bucket creation before continuing.${NC}"
    echo "Open: https://console.firebase.google.com/project/$PROJECT_ID/storage"
    exit 1
fi

echo
echo "Checking for firebase.json file..."
if [ ! -f "firebase.json" ]; then
    echo -e "${YELLOW}firebase.json file not found. Creating it...${NC}"
    cat > firebase.json << EOF
{
  "storage": {
    "rules": "storage.rules"
  }
}
EOF
    echo -e "${GREEN}Created firebase.json file.${NC}"
else
    echo -e "${YELLOW}firebase.json file found. Checking if storage configuration exists...${NC}"
    if ! grep -q '"storage"' firebase.json; then
        echo -e "${YELLOW}Adding storage configuration to firebase.json...${NC}"
        # Create a temporary file with proper JSON structure
        TMP_FILE=$(mktemp)
        # Extract the JSON content without the closing brace
        sed '$ s/}//' firebase.json > "$TMP_FILE"
        # Add the storage configuration and closing brace
        echo '  ,"storage": {' >> "$TMP_FILE"
        echo '    "rules": "storage.rules"' >> "$TMP_FILE"
        echo '  }' >> "$TMP_FILE"
        echo '}' >> "$TMP_FILE"
        # Replace the original file
        mv "$TMP_FILE" firebase.json
        echo -e "${GREEN}Updated firebase.json with storage configuration.${NC}"
    else
        echo -e "${GREEN}Storage configuration already exists in firebase.json.${NC}"
    fi
fi

echo "Do you want to deploy storage rules? (y/n): "
read DEPLOY_RULES

if [ "$DEPLOY_RULES" = "y" ]; then
    echo "Deploying storage rules..."
    firebase deploy --only storage

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Storage rules deployed successfully!${NC}"
    else
        echo -e "${RED}Failed to deploy storage rules.${NC}"
        echo "Please check your storage.rules file and try again."
        echo "Continuing anyway since you've already set up the bucket manually..."
    fi
else
    echo "Skipping storage rules deployment..."
fi

echo
echo "Testing Firebase Storage configuration..."
echo "Do you want to run the storage test script? (y/n): "
read RUN_TEST

if [ "$RUN_TEST" = "y" ]; then
    echo "Running test script..."
    node -r dotenv/config scripts/test-firebase-storage.cjs
else
    echo "Skipping storage test..."
    echo -e "${YELLOW}Assuming storage bucket is already configured correctly.${NC}"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Firebase Storage is configured correctly!${NC}"
    echo "You can now proceed with file migration."
else
    echo -e "${RED}Firebase Storage configuration test failed.${NC}"
    echo "Please check the error message above and fix the configuration."
    echo "Common issues:"
    echo "1. Storage bucket not created properly"
    echo "2. Storage rules not deployed correctly"
    echo "3. Environment variables not set correctly"
    echo
    echo "Verify your .env file contains the correct Firebase configuration:"
    echo "FIREBASE_API_KEY=..."
    echo "FIREBASE_AUTH_DOMAIN=..."
    echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
    echo "FIREBASE_STORAGE_BUCKET=$PROJECT_ID.appspot.com"
    echo "FIREBASE_MESSAGING_SENDER_ID=..."
    echo "FIREBASE_APP_ID=..."
fi

echo
echo -e "${BOLD}Next Steps:${NC}"
echo "1. Run the file migration script to transfer files from Supabase to Firebase Storage"
echo "2. Update any remaining code that directly references Supabase Storage"
echo "3. Test the application to ensure all file operations work correctly"
echo
echo -e "${GREEN}Setup guide complete!${NC}"
