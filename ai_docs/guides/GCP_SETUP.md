# Google Cloud Platform (GCP) Setup Guide

This guide provides step-by-step instructions for setting up Google Cloud Platform (GCP) for the Teach Niche platform.

## Prerequisites

- Google account with administrative access
- Credit card for GCP billing (even for free tier)
- Basic understanding of cloud infrastructure concepts

## Initial Setup

### 1. Create a GCP Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter "teachnicheofficial" as the Project name (or your preferred name)
5. Select an organization if applicable (or leave as "No Organization")
6. Click "Create"

### 2. Set Up Billing

1. In the GCP Console, navigate to "Billing"
2. Click "Link a billing account"
3. Either create a new billing account or select an existing one
4. Follow the prompts to set up payment information
5. Enable billing for your project

### 3. Enable Required APIs

Navigate to "APIs & Services" > "Library" and enable the following APIs:

- Cloud SQL Admin API
- Cloud Storage API
- Secret Manager API
- Cloud Logging API
- Cloud Monitoring API
- Identity and Access Management (IAM) API
- Cloud Resource Manager API

For each API:
1. Search for the API name
2. Click on the API in the results
3. Click "Enable"

## Setting Up Core Services

### 1. Cloud SQL (PostgreSQL)

1. Navigate to "SQL" in the GCP Console
2. Click "Create Instance"
3. Select "PostgreSQL"
4. Configure your instance:
   - Instance ID: `teachniche-db-instance`
   - Password: Generate a strong password
   - Region: `us-central1` (or your preferred region)
   - Zone: `us-central1-a` (or your preferred zone)
   - Database version: PostgreSQL 14 (or latest stable version)
5. Expand "Show Configuration Options"
   - Machine type: `db-f1-micro` for development, or select based on needs
   - Storage: Start with 10GB and enable automatic storage increase
   - Connections: Allow only secure connections
6. Click "Create"
7. Once the instance is created, click on it
8. Go to "Databases" and click "Create Database"
   - Database name: `teach-niche-db`
   - Click "Create"
9. Go to "Users" and click "Add User Account"
   - Username: `teach-niche-app`
   - Password: Generate a strong password
   - Click "Add"

### 2. Cloud Storage

1. Navigate to "Storage" in the GCP Console
2. Click "Create Bucket"
3. Configure your bucket:
   - Name: `teachnicheofficial-media` (must be globally unique)
   - Location type: Region
   - Location: `us-central1` (same as your database)
   - Storage class: Standard
   - Access control: Fine-grained
   - Protection tools: None for development (enable versioning for production)
4. Click "Create"
5. Set up CORS for the bucket:
   - Select your bucket
   - Go to the "Permissions" tab
   - Click "CORS configuration"
   - Add a configuration like:
     ```json
     [
       {
         "origin": ["https://your-domain.com", "http://localhost:3000"],
         "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "responseHeader": ["Content-Type", "Authorization"],
         "maxAgeSeconds": 3600
       }
     ]
     ```
   - Click "Save"

### 3. IAM Setup

1. Navigate to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Configure the service account:
   - Service account name: `teach-niche-app`
   - Service account ID: `teach-niche-app`
   - Description: "Service account for Teach Niche application"
4. Click "Create and Continue"
5. Assign the following roles:
   - Cloud SQL Client
   - Storage Object Admin
   - Secret Manager Secret Accessor
6. Click "Continue" and then "Done"
7. Click on the newly created service account
8. Go to the "Keys" tab
9. Click "Add Key" > "Create new key"
10. Select JSON format
11. Click "Create"
12. Save the downloaded JSON file securely - this is your service account key

## Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```
# GCP Configuration
GOOGLE_CLOUD_PROJECT=teachnicheofficial
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Cloud SQL
DB_HOST=/cloudsql/teachnicheofficial:us-central1:teachniche-db-instance
DB_USER=teach-niche-app
DB_PASSWORD=your-db-password
DB_NAME=teach-niche-db

# Cloud Storage
STORAGE_BUCKET=teachnicheofficial-media
```

For production, these values should be set as environment variables in your deployment platform.

## Terraform Setup (Optional but Recommended)

For infrastructure as code, we use Terraform to manage GCP resources:

1. Install Terraform from [terraform.io](https://www.terraform.io/downloads.html)
2. Navigate to the `terraform/environments/dev` directory
3. Update `variables.tf` with your project details if needed
4. Initialize Terraform:
   ```bash
   terraform init
   ```
5. Plan your infrastructure:
   ```bash
   terraform plan
   ```
6. Apply the configuration:
   ```bash
   terraform apply
   ```

## Security Best Practices

1. **Principle of Least Privilege**: Only grant necessary permissions to service accounts
2. **Rotate Service Account Keys**: Regularly rotate service account keys
3. **Enable VPC Service Controls**: For production environments
4. **Use Cloud Audit Logs**: Monitor access to sensitive resources
5. **Enable Cloud Security Command Center**: For security monitoring
6. **Set Up Alerts**: Configure alerts for suspicious activities
7. **Regular Security Reviews**: Schedule regular security reviews

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Verify service account has the correct roles
   - Check if the service account key is correctly set up

2. **Connection Issues to Cloud SQL**
   - Verify IP allowlisting if connecting from outside GCP
   - Check if the Cloud SQL Admin API is enabled
   - Verify connection string format

3. **Storage Access Issues**
   - Check bucket permissions
   - Verify CORS configuration if accessing from browser
   - Ensure service account has Storage Object Admin role

## Next Steps

After setting up GCP:

1. Set up Firebase Authentication (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
2. Configure your application to connect to Cloud SQL
3. Set up Cloud Storage integration
4. Configure monitoring and logging
5. Set up CI/CD pipelines with GCP integration

---

*For any issues with this setup, please contact the DevOps team.*
