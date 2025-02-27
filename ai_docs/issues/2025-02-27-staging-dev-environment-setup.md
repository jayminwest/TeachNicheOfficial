# Staging/Dev Environment Setup Guide

This document outlines the process for creating and maintaining a full-scale staging/development environment that closely mirrors the production environment. This includes setting up Supabase and Stripe environments for the dev branch.

## Overview

A proper staging environment allows for:
- Testing new features in an environment similar to production
- Validating database migrations before applying to production
- Testing payment flows without affecting real customer data
- Verifying third-party integrations in isolation

## Prerequisites

- GitHub access with permissions to the dev branch
- Supabase account with access to create/manage branches
- Stripe account with permissions to create test environments
- Vercel account (if using Vercel for deployments)
- Local development environment set up

## Firebase/GCP Setup

### 1. Project Configuration

The dev environment in GCP/Firebase should be configured as follows:

```bash
# Note: These are commands you would execute through the GCP/Firebase Console or CLI
# This is for documentation purposes only
```

1. **Create a separate dev project** (if not already created):
   - Navigate to the Google Cloud Console
   - Create a new project named "teachniche-dev"
   - Link it to the same billing account as production
   - Enable the same APIs as in production

2. **Configure environment variables**:
   - In the Firebase console, navigate to your dev project
   - Go to Project Settings
   - Note the Firebase configuration for the dev environment
   - These will be different from your production keys

### 2. Database Schema Setup

Since the dev environment is currently empty, you need to populate it with the schema from production:

1. **Export the production schema**:
   - Use the Cloud SQL export feature to export your production schema
   - Alternatively, you can use the migration files if you have them

2. **Import the schema to dev**:
   - Apply the schema to your dev Cloud SQL instance
   - Verify all tables, functions, and triggers are correctly created

3. **Seed with test data**:
   - Create a script to populate the dev database with realistic test data
   - Ensure the test data covers all use cases and edge cases
   - Include various user types, content types, and transaction states

### 3. Authentication Configuration

1. **Configure auth providers**:
   - In Firebase Authentication, enable the same authentication providers as in production
   - Use test credentials for OAuth providers where applicable
   - Configure email templates for the dev environment

2. **Create test users**:
   - Create accounts with different permission levels
   - Document credentials for team access

## Stripe Setup

### 1. Test Environment Configuration

1. **Create a test environment in Stripe**:
   - Ensure you're using Stripe's test mode
   - Configure webhooks to point to your dev environment
   - Set up the same products and price points as in production

2. **API Keys and Webhooks**:
   - Generate test API keys
   - Configure webhook endpoints for your dev environment
   - Set up webhook signing secrets

3. **Configure for merchant of record model**:
   - Set up the same fee structure (85% to creators, buyers pay processing fees)
   - Configure tax settings for test transactions
   - Set up test payment methods

### 2. Test Payment Flows

1. **Create test customers and payment methods**:
   - Set up test cards with various scenarios (success, failure, 3DS, etc.)
   - Document test card numbers and scenarios

2. **Test creator accounts**:
   - Set up test creator accounts with connected accounts
   - Configure payout settings (test mode)

## Environment Variables and Configuration

Create a comprehensive set of environment variables for the dev environment:

1. **Application environment variables**:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-dev-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-dev-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-dev-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-dev-measurement-id
   
   # Google Cloud SQL
   DB_HOST=/cloudsql/your-dev-project:us-central1:teachniche-db-instance
   DB_USER=teach-niche-app
   DB_PASSWORD=your-dev-db-password
   DB_NAME=teach-niche-db
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   
   # Mux Configuration
   MUX_TOKEN_ID=your-dev-mux-token-id
   MUX_TOKEN_SECRET=your-dev-mux-token-secret
   ```

2. **Configure Vercel project**:
   - Create a separate deployment for the dev branch
   - Configure environment variables in Vercel
   - Set up preview deployments for pull requests

## CI/CD Pipeline

Set up a CI/CD pipeline specific to the dev environment:

1. **GitHub Actions workflow**:
   - Create a workflow file for the dev branch
   - Include tests, linting, and build steps
   - Configure deployment to the dev environment

2. **Automated testing**:
   - Configure end-to-end tests to run against the dev environment
   - Include payment flow testing with test cards
   - Set up database migration testing

## Monitoring and Logging

1. **Set up monitoring**:
   - Configure error tracking (e.g., Sentry) for the dev environment
   - Set up performance monitoring
   - Configure alerts for critical issues

2. **Logging**:
   - Implement comprehensive logging
   - Configure log levels (more verbose in dev)
   - Set up log aggregation

## Data Synchronization (Optional)

For keeping the dev environment up-to-date with production:

1. **Scheduled data syncs**:
   - Create a script to sync anonymized data from production to dev
   - Schedule regular syncs (weekly or as needed)
   - Ensure personal/sensitive data is properly anonymized

2. **Schema synchronization**:
   - Maintain schema parity between environments
   - Document any intentional differences

## Testing Procedures

1. **Pre-deployment testing checklist**:
   - Feature functionality testing
   - Payment flow testing
   - Authentication testing
   - Performance testing
   - Cross-browser compatibility
   - Mobile responsiveness

2. **User acceptance testing**:
   - Define UAT procedures for the dev environment
   - Document test scenarios and expected outcomes

## Security Considerations

1. **Access control**:
   - Restrict access to the dev environment
   - Use different credentials than production
   - Implement IP restrictions if necessary

2. **Data protection**:
   - Never use real customer data in dev
   - Implement data anonymization for any production data used
   - Ensure compliance with data protection regulations

## Troubleshooting Common Issues

1. **Database connection issues**:
   - Check environment variables
   - Verify network access to Supabase
   - Check for IP restrictions

2. **Authentication problems**:
   - Verify OAuth configuration
   - Check email templates and delivery
   - Test with multiple providers

3. **Payment processing issues**:
   - Verify Stripe webhook configuration
   - Check test card details
   - Verify API keys and environment

## Maintenance Procedures

1. **Regular updates**:
   - Schedule regular refreshes of the dev environment
   - Keep third-party integrations up-to-date
   - Document any manual steps required

2. **Cleanup procedures**:
   - Implement data retention policies
   - Clean up test data periodically
   - Remove unused resources

## Documentation

1. **Environment documentation**:
   - Maintain up-to-date documentation of the dev environment
   - Document any differences from production
   - Keep a changelog of environment changes

2. **Access information**:
   - Document access procedures
   - Maintain a list of team members with access
   - Document credential management procedures

## Next Steps

1. **Initial setup**:
   - Create the Supabase dev branch schema
   - Configure Stripe test environment
   - Set up environment variables
   - Deploy initial version

2. **Validation**:
   - Verify all components are working
   - Test critical user flows
   - Validate third-party integrations

3. **Team onboarding**:
   - Train team members on dev environment usage
   - Document access procedures
   - Schedule regular review of environment status

## Conclusion

A properly configured staging/dev environment is essential for maintaining a high-quality application. By following this guide, you'll create an environment that closely mirrors production, allowing for thorough testing and validation before deploying changes to your users.

Remember to keep the environments as similar as possible while maintaining proper separation of concerns and security boundaries.
