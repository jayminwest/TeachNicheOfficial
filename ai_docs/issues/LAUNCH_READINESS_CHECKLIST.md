# Launch Readiness Checklist: Critical Issues for Teach Niche Platform

## Overview

This issue report serves as a comprehensive checklist for resolving critical issues before the product launch (deadline: tomorrow night). The focus areas are lesson creation, Stripe Connect integration, and various smaller bugs that impact core functionality.

## Diagnosis Approach

To effectively diagnose and fix these issues, we need to examine specific files and implement sustainable solutions that prevent these problems from recurring.

## Priority 1: Lesson Creation Flow

### Issue Description
Users encounter errors during lesson creation, specifically when uploading video content. The error appears to be related to the Mux video integration:

```
Error creating upload URL: TypeError: Cannot read properties of undefined (reading 'Uploads')
at Uploads (app/api/mux/upload-url/route.ts:34:31)
```

### Technical Analysis
- The error occurs in the `/api/mux/upload-url/route.ts` file at line 34
- The `Video.Uploads` object appears to be undefined, suggesting an initialization issue with the Mux SDK
- This blocks the entire lesson creation flow and prevents testing of the purchase flow

### Root Cause Analysis
The error suggests that the Mux SDK initialization is failing. This could be due to:

1. **Missing or incorrect environment variables**: The Mux token ID or secret might be missing or incorrect
2. **Improper SDK initialization**: The Mux client might not be initialized correctly in `app/services/mux/index.ts`
3. **Version mismatch**: There might be a version mismatch between the Mux SDK and the API we're trying to use

### Key Files to Examine
- `app/api/mux/upload-url/route.ts` - Contains the error in the Uploads API call
- `app/services/mux/index.ts` - Likely contains the Mux SDK initialization
- `app/services/mux.ts` - Main service implementation for Mux
- `app/components/ui/video-uploader.tsx` - Client-side implementation of video upload
- Environment variables configuration for Mux credentials

### Detailed Investigation Steps
1. **Verify Environment Variables**:
   - Check if `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are properly set in the environment
   - Verify these values are valid by testing them with the Mux API directly

2. **Examine Mux Client Initialization**:
   - Review `app/services/mux/index.ts` to see how the Mux client is initialized
   - Check if there's proper error handling during initialization
   - Verify the client is being exported and imported correctly

3. **Analyze API Route Implementation**:
   - Review `app/api/mux/upload-url/route.ts` to see how it's using the Mux client
   - Check if it's properly handling potential initialization failures
   - Add proper error handling and logging

4. **Test Mux API Directly**:
   - Create a simple test script to verify Mux API credentials work outside the application
   - Test the specific Uploads API to ensure it's accessible with our credentials

### Action Items Checklist
- [ ] 1.1 Fix Mux SDK initialization in the upload URL API route
- [ ] 1.2 Implement proper error handling and fallbacks for Mux API calls
- [ ] 1.3 Add retry logic for transient failures in Mux operations
- [ ] 1.4 Verify proper environment variables for Mux are set
- [ ] 1.5 Create a validation script for Mux configuration
- [ ] 1.6 Test video upload functionality end-to-end
- [ ] 1.7 Ensure uploaded videos are properly processed by Mux
- [ ] 1.8 Verify lesson creation completes successfully with video content
- [ ] 1.9 Test the complete lesson creation flow with various video formats and sizes
- [ ] 1.10 Create Playwright E2E tests for the lesson creation flow

### Proposed Solution
1. **Enhance Mux Service** (`app/services/mux/index.ts`):
   - Add robust initialization with validation of environment variables
   - Implement retry logic for transient failures
   - Add detailed error logging
   - Create a health check method to verify Mux connectivity

2. **Improve API Route** (`app/api/mux/upload-url/route.ts`):
   - Add proper error handling
   - Implement request validation
   - Add detailed logging
   - Create fallback mechanisms

## Priority 2: Stripe Connect Integration (RESOLVED)

### Issue Description
The Stripe Connect flow appears to complete successfully on Stripe's side, but the application database is not being properly updated. This results in the Stripe Account Status section showing as incomplete when it should be complete.

### Resolution Summary
This issue has been resolved by implementing a simplified approach to Stripe account verification that relies solely on the Stripe account ID. The key changes include:

1. **Added a Simplified Verification Function**:
   - Created `verifyStripeAccountById` function in `app/services/stripe.ts` that takes just the account ID and returns the account status
   - This function directly queries Stripe's API to get the current account status

2. **Updated API Endpoints**:
   - Modified `/api/stripe/connect/status/route.ts` to use the new verification function
   - Modified `/api/profile/stripe-status/route.ts` to use the new verification function
   - Updated `/api/stripe/connect/callback/route.ts` to properly handle the redirect from Stripe

3. **Enhanced UI Components**:
   - Added a refresh button to `app/components/ui/stripe-account-status.tsx` that fetches the latest status from Stripe
   - Updated `app/components/ui/stripe-connect-button.tsx` to display detailed status information
   - Improved error handling and user feedback

4. **Improved Database Updates**:
   - Ensured database is updated with the latest status from Stripe
   - Added proper error handling for database operations

### Verification Steps
- [x] 2.1 Verified Stripe Connect API integration is correctly implemented
- [x] 2.2 Ensured database updates occur after successful Stripe onboarding
- [x] 2.3 Implemented better error handling and logging for Stripe Connect flow
- [x] 2.4 Added status checks to verify Stripe account status is correctly reflected
- [x] 2.5 Added a manual refresh mechanism for Stripe account status
- [x] 2.6 Tested the complete Stripe Connect flow end-to-end
- [x] 2.7 Implemented proper error messaging for users if Stripe Connect fails

### Technical Details
The core of the solution is the new `verifyStripeAccountById` function that provides a consistent way to check a Stripe account's status using only the account ID. This function:

1. Retrieves the account details from Stripe
2. Checks if the account has details submitted, charges enabled, and payouts enabled
3. Returns a standardized status object with all relevant information
4. Updates the database with the latest status

This approach ensures that our application always has the most up-to-date information about a Stripe account's status, and provides users with a way to manually refresh this information if needed.

## Priority 3: Various Smaller Bugs

### 3.1 Paid Lessons Without Stripe Account

#### Issue Description
Users can currently create paid lessons without having a confirmed Stripe Connect account.

#### Key Files to Examine
- `app/components/ui/lesson-form.tsx` - Form for creating/editing lessons
- `app/api/lessons/route.ts` - API endpoint for creating lessons
- `app/services/database/lessonsService.ts` - Service for lesson operations

#### Detailed Investigation Steps
1. **Examine Lesson Form**:
   - Review how price validation is currently implemented in `app/components/ui/lesson-form.tsx`
   - Check if there's any validation related to Stripe account status
   - Verify how the form handles submission with prices > 0

2. **Analyze Server-Side Validation**:
   - Check if there's any server-side validation for lesson creation in `app/api/lessons/route.ts`
   - Verify how the API handles lessons with prices > 0

#### Action Items Checklist
- [ ] 3.1.1 Add validation to prevent setting prices > 0 without a verified Stripe account
- [ ] 3.1.2 Display appropriate error messages to guide users to complete Stripe onboarding
- [ ] 3.1.3 Implement server-side validation as a fallback security measure
- [ ] 3.1.4 Test this validation with various user scenarios
- [ ] 3.1.5 Create unit tests for this validation logic

#### Proposed Solution
1. **Enhance Lesson Form** (`app/components/ui/lesson-form.tsx`):
   - Add client-side validation to prevent setting prices > 0 without a verified Stripe account
   - Implement clear user feedback
   - Add a check to fetch Stripe account status before allowing paid lessons

2. **Improve Server-Side Validation** (`app/api/lessons/route.ts`):
   - Add validation in the lesson creation/update API routes
   - Implement proper error responses
   - Add logging for validation failures

### 3.2 Toast Notification Issues

#### Issue Description
Toast notifications don't disappear automatically, leading to a cluttered UI.

#### Key Files to Examine
- `app/components/ui/toast.tsx` - Toast component implementation
- `app/components/ui/use-toast.ts` - Toast hook implementation
- `app/components/ui/toast-display.tsx` - Toast display component
- `app/components/ui/toaster.tsx` - Toaster component

#### Detailed Investigation Steps
1. **Examine Toast Implementation**:
   - Review how toast dismissal is currently implemented in `app/components/ui/toast.tsx`
   - Check if there are any timeout settings in `app/components/ui/use-toast.ts`
   - Verify how multiple toasts are managed in `app/components/ui/toast-display.tsx`

2. **Analyze Toast Usage**:
   - Check how toasts are being created throughout the application
   - Verify if timeout settings are being passed

#### Action Items Checklist
- [ ] 3.2.1 Fix toast notification auto-dismiss functionality
- [ ] 3.2.2 Ensure all toasts have appropriate timeout settings
- [ ] 3.2.3 Implement a cleanup mechanism for stale toasts
- [ ] 3.2.4 Test toast behavior across different actions
- [ ] 3.2.5 Create component tests for toast behavior

#### Proposed Solution
1. **Enhance Toast Component** (`app/components/ui/toast.tsx` and `app/components/ui/use-toast.ts`):
   - Add default timeout settings
   - Implement automatic cleanup for stale toasts
   - Add a toast manager to handle multiple toasts

2. **Update Toast Usage**:
   - Ensure all toast calls include appropriate timeout settings
   - Implement consistent toast creation patterns

### 3.3 Header Navigation Issues

#### Issue Description
The header menu doesn't collapse automatically when navigating to a new page.

#### Key Files to Examine
- `app/components/ui/header.tsx` - Header component implementation
- `app/layout.tsx` - Main layout component that includes the header

#### Detailed Investigation Steps
1. **Examine Header Implementation**:
   - Review how the mobile menu is currently implemented in `app/components/ui/header.tsx`
   - Check if there's any integration with Next.js router events
   - Verify how the menu state is managed

2. **Analyze Navigation Events**:
   - Check how navigation is handled in the application
   - Verify if there are any event listeners for route changes

#### Action Items Checklist
- [ ] 3.3.1 Fix header collapse behavior on page navigation
- [ ] 3.3.2 Use Next.js router events to detect navigation
- [ ] 3.3.3 Ensure mobile responsiveness of header
- [ ] 3.3.4 Test header behavior across different devices and screen sizes
- [ ] 3.3.5 Create component tests for header navigation behavior

#### Proposed Solution
1. **Enhance Header Component** (`app/components/ui/header.tsx`):
   - Add integration with Next.js router events to detect navigation
   - Implement automatic menu collapse on navigation
   - Add proper state management for the menu

2. **Improve Mobile Responsiveness**:
   - Ensure the header behaves correctly on all screen sizes
   - Implement smooth transitions for menu collapse

## Testing Requirements

To ensure launch readiness, the following end-to-end flows must be tested and verified:

1. **Complete Lesson Creation Flow**
   - [ ] T1.1 Create lesson with title, description, and price
   - [ ] T1.2 Upload video content successfully
   - [ ] T1.3 Verify video processing completes
   - [ ] T1.4 Publish lesson
   - [ ] T1.5 Verify lesson appears in marketplace
   - [ ] T1.6 Create Playwright E2E test for this flow

2. **Complete Purchase Flow**
   - [ ] T2.1 Browse lessons as a student
   - [ ] T2.2 Purchase a lesson with Stripe
   - [ ] T2.3 Verify access to purchased content
   - [ ] T2.4 Verify purchase records in database
   - [ ] T2.5 Create Playwright E2E test for this flow

3. **Complete Payout Flow (PARTIALLY RESOLVED)**
   - [x] T3.1 Verify Stripe Connect account setup works correctly
   - [x] T3.2 Verify account status is correctly reflected in the UI
   - [ ] T3.3 Verify creator earnings are calculated correctly
   - [ ] T3.4 Verify Stripe Connect account receives funds
   - [ ] T3.5 Test international payment scenarios
   - [ ] T3.6 Create integration tests for payout calculations

4. **Error Handling**
   - [ ] T4.1 Verify appropriate error messages for all failure scenarios
   - [ ] T4.2 Test recovery from service failures (Mux, Stripe)
   - [ ] T4.3 Ensure no unhandled exceptions in production environment
   - [ ] T4.4 Implement structured error logging

## Testing Strategy

To ensure all fixes work correctly, we'll need:

1. **Unit Tests**:
   - [ ] TS1.1 Test Mux service initialization and error handling
   - [ ] TS1.2 Test Stripe service initialization and webhook processing
   - [ ] TS1.3 Test form validation for lesson creation
   - [ ] TS1.4 Add tests for `app/services/mux/index.ts` and `app/services/stripe.ts`

2. **Integration Tests**:
   - [ ] TS2.1 Test Mux upload flow end-to-end
   - [ ] TS2.2 Test Stripe Connect flow end-to-end
   - [ ] TS2.3 Test lesson creation and purchase flow
   - [ ] TS2.4 Add tests for `app/api/mux/upload-url/route.ts` and `app/api/stripe/connect/callback/route.ts`

3. **End-to-End Tests**:
   - [ ] TS3.1 Create Playwright tests for the complete lesson creation flow
   - [ ] TS3.2 Create Playwright tests for the complete purchase flow
   - [ ] TS3.3 Create Playwright tests for the Stripe Connect flow
   - [ ] TS3.4 Add tests to `app/__tests__/` directory

## Environment Verification

Before launch, verify:

- [ ] EV1. Run the comprehensive API key verification test (`app/__tests__/api-key-verification.test.ts`)
- [ ] EV2. Use the environment validation utilities (`app/lib/env-validation.ts`) during application startup
- [ ] EV3. Check the health check endpoint (`/api/debug/health-check`) to verify all services are accessible
- [ ] EV4. All required environment variables are set in production
- [ ] EV5. Stripe webhook endpoints are correctly configured
- [ ] EV6. Mux API keys and configuration are correct
- [ ] EV7. Database access and permissions are properly set up
- [ ] EV8. No development/testing artifacts remain in production code
- [ ] EV9. Create a pre-deployment checklist script that runs all verification tests

### Environment Validation Process

1. **Automated Testing**:
   - [ ] EVP1.1 Run `npm test -- api-key-verification` to verify all API keys and environment variables
   - [ ] EVP1.2 This test should be run before any deployment to staging or production

2. **Runtime Validation**:
   - [ ] EVP2.1 The application should validate environment variables during startup
   - [ ] EVP2.2 Use `validateEnvironment()` from `app/lib/env-validation.ts` in a startup script

3. **Continuous Monitoring**:
   - [ ] EVP3.1 Set up monitoring for the health check endpoint
   - [ ] EVP3.2 Configure alerts for any service failures

## Implementation Timeline

Given the deadline (tomorrow night), here's a proposed timeline:

1. **Immediate (First 1 hour)**:
   - Create and run a comprehensive API key verification test
   - Test all third-party service credentials (Mux, Stripe)
   - Verify environment variables are correctly set
   - Create a reusable test script for environment validation
   - Focus on `app/services/mux/index.ts` and `app/services/stripe.ts`

2. **Morning (Next 3 hours)**:
   - Fix Mux integration issue (Priority 1)
   - Focus on `app/services/mux/index.ts` and `app/api/mux/upload-url/route.ts`
   - Add comprehensive tests for the fix
   - Deploy and verify the fix works in the staging environment

3. **Afternoon (Next 4 hours)**:
   - Fix Stripe Connect integration (Priority 2)
   - Focus on `app/api/webhooks/stripe/route.ts` and `app/api/stripe/connect/callback/route.ts`
   - Add comprehensive tests for the fix
   - Deploy and verify the fix works in the staging environment

4. **Evening (Final 4 hours)**:
   - Fix the smaller bugs (Priority 3)
   - Focus on `app/components/ui/lesson-form.tsx`, `app/components/ui/toast.tsx`, and `app/components/ui/header.tsx`
   - Perform final testing of all fixes
   - Deploy to production and monitor for issues

## Monitoring and Rollback Plan

1. **Monitoring**:
   - [ ] M1.1 Set up detailed logging for all fixed components
   - [ ] M1.2 Create alerts for any failures in the fixed components
   - [ ] M1.3 Monitor key metrics (lesson creation, purchases, etc.)

2. **Rollback Plan**:
   - [ ] R2.1 Create a snapshot of the current production environment
   - [ ] R2.2 Prepare rollback scripts for each fix
   - [ ] R2.3 Define clear criteria for when to roll back

## Sustainable Solutions

To prevent these issues from recurring in the future, we should implement:

### 1. Comprehensive Testing Strategy
- [ ] SS1.1 End-to-end tests for all critical user flows
- [ ] SS1.2 Integration tests for API routes and service interactions
- [ ] SS1.3 Unit tests for business logic and validation
- [ ] SS1.4 Visual regression tests for UI components
- [ ] SS1.5 Set up CI/CD pipeline to run tests before deployment

### 2. Robust Error Handling
- [ ] SS2.1 Implement consistent error handling patterns across the application
- [ ] SS2.2 Add retry mechanisms for transient failures
- [ ] SS2.3 Create circuit breakers for external service failures
- [ ] SS2.4 Implement graceful degradation for non-critical features

### 3. Monitoring and Alerting
- [ ] SS3.1 Set up structured logging for all service interactions
- [ ] SS3.2 Implement real-time alerts for critical failures
- [ ] SS3.3 Create dashboards for key metrics (lesson creation, purchases)
- [ ] SS3.4 Monitor third-party service health (Stripe, Mux)

### 4. Data Consistency Checks
- [ ] SS4.1 Implement background jobs to verify database consistency
- [ ] SS4.2 Create reconciliation processes for external services
- [ ] SS4.3 Add data validation at all input points
- [ ] SS4.4 Implement database migration tests

## Additional Considerations

- [ ] AC1. Perform final security review
- [ ] AC2. Verify all API endpoints have proper authentication
- [ ] AC3. Check for any performance bottlenecks
- [ ] AC4. Ensure all critical user journeys have been tested
- [ ] AC5. Prepare monitoring and error tracking for post-launch issues
- [ ] AC6. Create runbooks for common operational tasks
- [ ] AC7. Document troubleshooting procedures for known issues

## Launch Readiness Criteria

The platform will be considered ready for launch when:
1. All Priority 1 and 2 items are resolved (Priority 2 - Stripe Connect Integration is now RESOLVED)
2. At least 90% of Priority 3 items are resolved
3. All core user flows (create, purchase, payout) work end-to-end
4. No critical security issues remain
5. All environment validations pass
6. End-to-end tests for critical flows succeed

## Progress Update

- Priority 2 (Stripe Connect Integration) has been resolved by implementing a simplified approach to Stripe account verification
- Added a manual refresh mechanism for Stripe account status
- Improved error handling and user feedback for the Stripe Connect flow
- Ensured database is updated with the latest status from Stripe

## Development Environment Recommendations

While using production environment variables during development helps ensure things work in production, it also carries risks. Consider:

1. Creating a staging environment that mirrors production
2. Using test accounts for third-party services in development
3. Implementing feature flags to safely roll out changes
4. Setting up separate webhook endpoints for development/staging/production

---

This checklist will be updated as issues are resolved or new issues are discovered during the pre-launch testing phase.
