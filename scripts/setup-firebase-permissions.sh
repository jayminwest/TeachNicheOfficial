#!/bin/bash

# Script to set up Firebase permissions for the GCP project

# Set variables
PROJECT_ID="teachnicheofficial"
USER_EMAIL="jaymin@teach-niche.com"

# Grant Firebase Admin role to the user (all on one line)
gcloud projects add-iam-policy-binding $PROJECT_ID --member="user:$USER_EMAIL" --role="roles/firebase.admin"

echo "Firebase admin permissions granted to $USER_EMAIL"

# Initialize Firebase with specific features
echo "Now initializing Firebase with Firestore and Storage..."
firebase init firestore storage
