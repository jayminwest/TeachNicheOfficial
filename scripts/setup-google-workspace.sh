#!/bin/bash
echo "Setting up Google Workspace API credentials"
echo "----------------------------------------"
echo "This script will guide you through setting up Google Workspace API credentials for email integration."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    echo "You need to log in to Google Cloud first."
    gcloud auth login
fi

# Set project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "No project selected. Please select a project:"
    gcloud projects list
    read -p "Enter project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "Using project: $PROJECT_ID"

# Enable Gmail API
echo "Enabling Gmail API..."
gcloud services enable gmail.googleapis.com

# Create OAuth consent screen
echo "Setting up OAuth consent screen..."
echo "Please follow these steps in the Google Cloud Console:"
echo "1. Go to https://console.cloud.google.com/apis/credentials/consent"
echo "2. Select 'External' user type"
echo "3. Fill in the required information (App name, user support email, developer contact)"
echo "4. Add the Gmail API scope: https://www.googleapis.com/auth/gmail.send"
echo "5. Add test users (your email addresses)"
echo ""
read -p "Press Enter when you've completed these steps..."

# Create OAuth client ID
echo "Creating OAuth client ID..."
echo "Please follow these steps in the Google Cloud Console:"
echo "1. Go to https://console.cloud.google.com/apis/credentials"
echo "2. Click 'Create Credentials' and select 'OAuth client ID'"
echo "3. Select 'Web application' as the application type"
echo "4. Add a name like 'Teach Niche Email Client'"
echo "5. Add authorized redirect URIs: http://localhost:3000/api/auth/callback/google"
echo "6. Click 'Create'"
echo "7. Copy the Client ID and Client Secret"
echo ""
read -p "Enter the Client ID: " CLIENT_ID
read -p "Enter the Client Secret: " CLIENT_SECRET

# Get refresh token
echo "Getting refresh token..."
echo "Please follow these steps:"
echo "1. Visit the following URL in your browser:"
echo "https://accounts.google.com/o/oauth2/auth?client_id=$CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/callback/google&scope=https://www.googleapis.com/auth/gmail.send&response_type=code&access_type=offline&prompt=consent"
echo "2. Sign in and authorize the application"
echo "3. You'll be redirected to a URL with a code parameter"
echo "4. Copy the ENTIRE URL you were redirected to"
echo ""
read -p "Enter the full redirect URL: " REDIRECT_URL

# Extract the authorization code from the URL
AUTH_CODE=$(echo "$REDIRECT_URL" | grep -o 'code=[^&]*' | cut -d'=' -f2)

if [ -z "$AUTH_CODE" ]; then
    echo "Error: Could not extract authorization code from URL."
    echo "Please make sure you copied the entire URL after authorization."
    exit 1
fi

echo "Extracted authorization code: $AUTH_CODE"

# Exchange code for tokens
echo "Exchanging code for tokens..."
TOKENS=$(curl -s -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code=$AUTH_CODE&redirect_uri=http://localhost:3000/api/auth/callback/google&grant_type=authorization_code" https://oauth2.googleapis.com/token)
echo "Token response: $TOKENS"

# Extract refresh token using a more reliable method
REFRESH_TOKEN=$(echo "$TOKENS" | grep -o '"refresh_token":"[^"]*"' | sed 's/"refresh_token":"//g' | sed 's/"//g')

# If that fails, try an alternative method
if [ -z "$REFRESH_TOKEN" ]; then
    echo "Trying alternative extraction method..."
    REFRESH_TOKEN=$(echo "$TOKENS" | python3 -c "import sys, json; print(json.load(sys.stdin).get('refresh_token', ''))" 2>/dev/null)
fi

# If Python is not available, try with Node.js
if [ -z "$REFRESH_TOKEN" ] && command -v node &> /dev/null; then
    echo "Trying Node.js extraction method..."
    REFRESH_TOKEN=$(echo "$TOKENS" | node -e "const data = JSON.parse(process.stdin.read()); console.log(data.refresh_token || '');" 2>/dev/null)
fi

echo "Extracted refresh token: $REFRESH_TOKEN"

if [ -z "$REFRESH_TOKEN" ]; then
    echo "Error: Failed to get refresh token. Please try again."
    exit 1
fi

# Update .env.local file
echo "Updating .env.local file..."
if [ -f .env.local ]; then
    # Check if we're on macOS or Linux for sed compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS version
        sed -i '' '/GOOGLE_CLIENT_ID/d' .env.local
        sed -i '' '/GOOGLE_CLIENT_SECRET/d' .env.local
        sed -i '' '/GOOGLE_REFRESH_TOKEN/d' .env.local
        sed -i '' '/GOOGLE_REDIRECT_URI/d' .env.local
        sed -i '' '/EMAIL_FROM/d' .env.local
    else
        # Linux version
        sed -i '/GOOGLE_CLIENT_ID/d' .env.local
        sed -i '/GOOGLE_CLIENT_SECRET/d' .env.local
        sed -i '/GOOGLE_REFRESH_TOKEN/d' .env.local
        sed -i '/GOOGLE_REDIRECT_URI/d' .env.local
        sed -i '/EMAIL_FROM/d' .env.local
    fi
    
    # Add new credentials
    echo "" >> .env.local
    echo "# Google Workspace API credentials" >> .env.local
    echo "GOOGLE_CLIENT_ID=\"$CLIENT_ID\"" >> .env.local
    echo "GOOGLE_CLIENT_SECRET=\"$CLIENT_SECRET\"" >> .env.local
    echo "GOOGLE_REFRESH_TOKEN=\"$REFRESH_TOKEN\"" >> .env.local
    echo "GOOGLE_REDIRECT_URI=\"http://localhost:3000/api/auth/callback/google\"" >> .env.local
    echo "EMAIL_FROM=\"noreply@teachniche.com\"" >> .env.local
else
    echo "# Google Workspace API credentials" > .env.local
    echo "GOOGLE_CLIENT_ID=\"$CLIENT_ID\"" >> .env.local
    echo "GOOGLE_CLIENT_SECRET=\"$CLIENT_SECRET\"" >> .env.local
    echo "GOOGLE_REFRESH_TOKEN=\"$REFRESH_TOKEN\"" >> .env.local
    echo "GOOGLE_REDIRECT_URI=\"http://localhost:3000/api/auth/callback/google\"" >> .env.local
    echo "EMAIL_FROM=\"noreply@teachniche.com\"" >> .env.local
fi

echo "Setup complete! Google Workspace API credentials have been added to .env.local"
echo "You can now use the GoogleWorkspaceEmail service to send emails."
