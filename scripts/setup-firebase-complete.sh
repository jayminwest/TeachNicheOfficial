#!/bin/bash

# Script to set up Firebase for the GCP project

# Set variables
PROJECT_ID="teachnicheofficial"
USER_EMAIL="jaymin@teach-niche.com"

echo "Enabling necessary APIs..."
gcloud services enable firebase.googleapis.com --project=$PROJECT_ID
gcloud services enable firestore.googleapis.com --project=$PROJECT_ID
gcloud services enable storage.googleapis.com --project=$PROJECT_ID
gcloud services enable identitytoolkit.googleapis.com --project=$PROJECT_ID

echo "Granting necessary permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="user:$USER_EMAIL" --role="roles/firebase.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="user:$USER_EMAIL" --role="roles/serviceusage.serviceUsageAdmin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="user:$USER_EMAIL" --role="roles/firebase.developAdmin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="user:$USER_EMAIL" --role="roles/resourcemanager.projectIamAdmin"

echo "Attempting to add Firebase to the project..."
firebase projects:addfirebase $PROJECT_ID

echo "IMPORTANT: Before initializing Firebase features, you need to create a Firestore database!"
echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo "2. Click 'Create database'"
echo "3. Choose 'Start in production mode'"
echo "4. Select a location closest to your users (e.g., 'us-central')"
echo "5. Click 'Enable'"

echo "After creating the Firestore database, initialize Firebase with required features:"
echo "Run: firebase init"
echo "Select these features when prompted:"
echo "- Firestore: Configure security rules and indexes files for Firestore"
echo "- Storage: Configure a security rules file for Cloud Storage"
echo "- Hosting (optional): If you need to host static assets"

echo "If you're still having issues, try creating a new Firebase project and linking it:"
echo "1. Run: firebase projects:create teachniche-firebase"
echo "2. Run: firebase use --add"
echo "3. Select the newly created project"

echo "Setup complete. If there were errors, please try using the Firebase Console instead:"
echo "https://console.firebase.google.com/"
