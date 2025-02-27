#!/bin/bash

# Script to enable Gmail API in Google Cloud project

echo "Enabling Gmail API in Google Cloud project..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK (gcloud) is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "You are not logged in to gcloud. Please login first:"
    gcloud auth login
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "No project selected. Please select a project:"
    gcloud projects list
    read -p "Enter project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "Enabling Gmail API for project: $PROJECT_ID"
gcloud services enable gmail.googleapis.com --project=$PROJECT_ID

echo "Gmail API has been enabled. It may take a few minutes for the change to propagate."
echo "After a few minutes, you can test the email service with:"
echo "  npx tsx scripts/test-email-service.ts your-email@example.com"
