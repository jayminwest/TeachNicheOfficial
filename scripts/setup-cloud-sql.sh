#!/bin/bash

# Script to set up Cloud SQL instance using Terraform

echo "Setting up Cloud SQL instance..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    echo "You can install it with: brew install --cask google-cloud-sdk"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "Error: terraform is not installed. Please install it first."
    echo "You can install it with: brew install terraform"
    exit 1
fi

# Check if user is logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "You need to log in to Google Cloud first."
    gcloud auth login
fi

# Set up application default credentials for Terraform
echo "Setting up application default credentials for Terraform..."
gcloud auth application-default login

# Set the project
gcloud config set project teachnicheofficial

# Navigate to Terraform directory
cd terraform/environments/dev

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Generate a plan
echo "Generating Terraform plan..."
terraform plan -out=cloud-sql-plan

# Apply the plan
echo "Applying Terraform plan to create Cloud SQL instance..."
terraform apply cloud-sql-plan

# Get the connection details
echo "Getting Cloud SQL connection details..."
INSTANCE_NAME=$(terraform output -raw db_instance_name)
INSTANCE_IP=$(terraform output -raw db_instance_ip)
DB_NAME=$(terraform output -raw db_name)
DB_USER=$(terraform output -raw db_user)

# Update .env file with connection details
echo "Updating .env file with Cloud SQL connection details..."
cat >> .env.local << EOF

# Cloud SQL Connection
CLOUD_SQL_HOST=${INSTANCE_IP}
CLOUD_SQL_PORT=5432
CLOUD_SQL_USER=${DB_USER}
CLOUD_SQL_DATABASE=${DB_NAME}
# Note: Add CLOUD_SQL_PASSWORD manually for security
EOF

echo "Cloud SQL instance setup complete!"
echo "Please add your CLOUD_SQL_PASSWORD to .env.local manually for security."
echo "You can now run the database migration script:"
echo "  node scripts/migrate-database.ts"
