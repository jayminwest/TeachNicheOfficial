# Populate Dev Supabase Database with Realistic Sample Data

## Issue Description

We've recently created a new dev branch in Supabase. This is attached to the dev/ branch, the branch that is being developed locally and all other sub branches of dev/. This database is currently empty. We need to not only fill it with sample data but realistic, valid sample data that will work with all of the services we are using.

## Technical Analysis

### Current State
- New dev Supabase branch is empty
- Connected to dev/ branch and all sub-branches
- No sample data exists for testing or development

### Required Data Sets
1. **User Accounts**
   - Complete user profiles with valid metadata
   - Various account states (new, active, creator status)
   - Authentication records with proper session handling

2. **Creator Profiles**
   - Complete profiles with bios, usernames, and avatar URLs
   - Stripe Connect accounts with test mode configurations
   - Various approval states and earnings histories

3. **Lessons**
   - Complete lesson records with valid metadata
   - Various states (draft, published, archived)
   - Connected to valid Mux video assets
   - Proper pricing and category assignments

4. **Purchases**
   - Transaction records with valid Stripe references
   - Various purchase states (pending, completed, refunded)
   - Proper relationships to users and lessons

5. **Categories**
   - Complete category hierarchy
   - Proper relationships to lessons

6. **Lesson Requests**
   - Various request states (open, in_progress, completed)
   - Upvotes and comments from multiple users
   - Proper relationships to categories

### Integration Requirements
- **Stripe**: Sample data must include valid Stripe test mode IDs for:
  - Customers
  - Payment intents
  - Connect accounts
  - Products and prices
  - Checkout sessions

- **Mux**: Sample data must include valid Mux test environment:
  - Asset IDs
  - Playback IDs
  - Valid status values
  - Proper metadata

- **Supabase Auth**: Sample users must have valid:
  - Auth records
  - Session tokens
  - Provider connections

## Affected Components

### Primary Components
- Database schema and relationships
- Authentication flows
- Payment processing and creator payouts
- Video playback and analytics

### Secondary Components
- Search and discovery features
- User profiles and dashboards
- Analytics and reporting
- Admin tools and moderation

## Implementation Plan

### 1. Create Seed Script Framework
- Develop a TypeScript-based seeding framework
- Implement idempotent operations (can be run multiple times safely)
- Add logging and error handling
- Create configuration for controlling which data sets to generate

### 2. Generate Base Data Sets
- Create users with valid auth records
- Generate categories and tags
- Create creator profiles with valid metadata
- Generate lesson templates with placeholder content

### 3. Integrate Third-Party Services
- Create test Stripe accounts and resources
- Generate Mux video assets with test content
- Link resources with proper foreign keys and metadata

### 4. Generate Relational Data
- Create purchase records linked to users and lessons
- Generate lesson request data with upvotes
- Create review and rating data
- Generate analytics and view records

### 5. Validation and Testing
- Verify all relationships are valid
- Test all API endpoints with sample data
- Verify third-party service integration
- Test all user flows with sample accounts

## Testing Requirements

### Data Integrity Tests
- Verify foreign key relationships
- Check for orphaned records
- Validate required fields have proper values
- Test constraints and triggers

### API Integration Tests
- Test all API endpoints with sample data
- Verify proper error handling with edge cases
- Test pagination and filtering with realistic data volumes

### Third-Party Service Tests
- Verify Stripe test mode integration
- Test Mux video playback with sample assets
- Validate authentication flows with sample users

## Additional Context

### User Impact
- Developers will have realistic data for testing
- UI/UX testing can use varied data scenarios
- Performance testing can simulate real-world conditions
- Integration testing can verify end-to-end flows

### Priority and Timeline
- **Priority**: High
- **Timeline**: Complete within 1 week
- **Dependencies**: None, but blocks comprehensive testing of new features

## Labels
- enhancement
- database
- testing
- integration

## Assignees
- Database team lead
- Integration specialist
