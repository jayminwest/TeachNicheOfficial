#!/bin/bash

# Script to set up Firestore for the GCP project

# Set variables
PROJECT_ID="teachnicheofficial"

echo "This script will help you set up Firestore for your project."
echo "First, you need to create a Firestore database in the Firebase console."
echo "Opening the Firebase console in your browser..."

# Open the Firebase console in the default browser
open "https://console.firebase.google.com/project/$PROJECT_ID/firestore"

echo "In the Firebase console:"
echo "1. Click 'Create database'"
echo "2. Choose 'Start in production mode'"
echo "3. Select a location closest to your users (e.g., 'us-central')"
echo "4. Click 'Enable'"
echo ""
echo "After creating the database, press Enter to continue with Firebase initialization..."
read -p ""

# Initialize Firebase with Firestore
echo "Initializing Firebase with Firestore..."
firebase init firestore

echo "Firestore setup complete!"
