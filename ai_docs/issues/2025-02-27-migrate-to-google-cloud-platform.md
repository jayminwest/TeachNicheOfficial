# Migrate to Google Cloud Platform

## Issue Type
- [x] Enhancement
- [ ] Bug
- [ ] Documentation
- [ ] Security
- [ ] Performance

## Priority
- [x] High
- [ ] Medium
- [ ] Low

## Description
This issue outlines the plan to migrate our infrastructure from Supabase to Google Cloud Platform (GCP) to create a more unified technology stack and leverage Google's ecosystem for our business operations.

## Motivation
As we're still pre-launch with no existing data, this is an ideal time to make a strategic infrastructure decision. Moving to GCP will allow us to:

1. Create a unified ecosystem with Google Workspace for email and business operations
2. Leverage enterprise-grade infrastructure that can scale with our needs
3. Access advanced capabilities like ML/AI that could provide future competitive advantages
4. Avoid technical debt and future migration challenges
5. Present a more professional impression to instructors and students

## Current Implementation
Currently, our application uses:
- Supabase for database, authentication, and storage
- Next.js for frontend and API routes
- Vercel for hosting
- Stripe for payments
- Mux for video processing

## Proposed Implementation
We will migrate to a GCP-based infrastructure:

1. **Database**: Replace Supabase PostgreSQL with Cloud SQL or Firestore
2. **Authentication**: Replace Supabase Auth with Firebase Authentication
3. **Storage**: Replace Supabase Storage with Cloud Storage
4. **Email**: Implement Google Workspace integration for email management
5. **Analytics**: Add Google Analytics and BigQuery for data analysis
6. **Infrastructure**: Define infrastructure as code using Terraform

## Migration Phases

### Phase 1: Setup and Planning
- [x] Create GCP project and configure initial IAM permissions (Project: teachnicheofficial)
- [x] Install necessary dependencies (Google Cloud libraries, Terraform, Google Cloud SDK)
- [x] Set up authentication with Google account
- [x] Create service abstraction layers for database, auth, storage, and email
- [ ] Set up billing alerts and monitoring
- [x] Define initial infrastructure as code with Terraform
- [ ] Create development environment in GCP

### Phase 2: Core Services Migration
- [ ] Migrate database schema to Cloud SQL
- [ ] Implement Firebase Authentication
- [ ] Update API routes to use GCP services
- [ ] Migrate file storage to Cloud Storage

### Phase 3: Email and Advanced Services
- [ ] Set up Google Workspace integration
- [ ] Implement email service for notifications
- [ ] Create waitlist notification system
- [ ] Add analytics and monitoring

### Phase 4: Testing and Deployment
- [ ] Comprehensive testing of all migrated services
- [ ] Update CI/CD pipelines for GCP deployment
- [ ] Performance testing and optimization
- [ ] Security review and hardening

## Technical Details

### Environment Setup (Completed)
- Created dedicated branch `feature/gcp-migration` for the migration work
- Installed required dependencies:
  ```
  npm install @google-cloud/storage firebase firebase-admin googleapis google-auth-library pg @types/pg pg-pool
  brew install terraform
  brew install --cask google-cloud-sdk
  ```
- Initialized Google Cloud SDK with `gcloud init`
- Selected project "teachnicheofficial" as the working project
- Created service abstraction layers for database, authentication, storage, and email
- Created initial Terraform configuration files for infrastructure

### Challenges Encountered
- Permission issues when trying to add Firebase to the GCP project
  - Error: "The caller does not have permission"
  - Need to grant additional IAM permissions to the account
- Billing budget creation requires proper formatting of the command

### Database Migration
- Export schema from Supabase
- Create equivalent schema in Cloud SQL using gcloud CLI where possible
- Update database client code to use GCP libraries
- Implement proper connection pooling and error handling

### Authentication Changes
- Replace Supabase Auth with Firebase Authentication
- Update authentication hooks and components
- Implement proper session management
- Ensure secure role-based access control

### Storage Migration
- Move files from Supabase Storage to Cloud Storage
- Update file upload/download logic
- Implement proper access controls and signed URLs
- Optimize for performance and cost

### Email Integration
- Set up Google Workspace API credentials
- Create email service for programmatic email sending
- Implement templates for different notification types
- Create admin interface for managing email communications

## Dependencies
- Google Cloud SDK
- Firebase Admin SDK
- Google APIs Node.js Client
- Terraform (for infrastructure as code)

## Estimated Effort
- Planning and setup: 2-3 days
- Core services migration: 5-7 days
- Email and advanced services: 3-4 days
- Testing and deployment: 3-5 days
- Total: 13-19 days

## Risks and Mitigation
1. **Learning Curve**: GCP has a steeper learning curve compared to Supabase
   - Mitigation: Allocate time for learning and documentation
   
2. **Cost Management**: GCP pricing can be complex
   - Mitigation: Set up detailed budget alerts and monitoring

3. **Service Disruption**: Ensuring smooth transition without service disruption
   - Mitigation: Develop and test thoroughly in parallel environment before switching

4. **Vendor Lock-in**: Increased dependency on Google ecosystem
   - Mitigation: Design with abstraction layers to reduce direct coupling

## Success Criteria
- All application functionality works with GCP services
- Performance meets or exceeds current implementation
- Infrastructure is defined as code and reproducible
- Proper monitoring and alerting is in place
- Documentation is updated to reflect new architecture

## Additional Notes
- This migration should be completed before public launch to avoid future migration challenges with live user data
- Whenever possible, use gcloud CLI commands to configure resources instead of the console UI to ensure reproducibility
- Document all CLI commands used for configuration to enable future automation
