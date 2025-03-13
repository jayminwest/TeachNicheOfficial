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

### Action Items
- [ ] Fix Mux SDK initialization in the upload URL API route
- [ ] Implement proper error handling and fallbacks for Mux API calls
- [ ] Add retry logic for transient failures in Mux operations
- [ ] Verify proper environment variables for Mux are set
- [ ] Create a validation script for Mux configuration
- [ ] Test video upload functionality end-to-end
- [ ] Ensure uploaded videos are properly processed by Mux
- [ ] Verify lesson creation completes successfully with video content
- [ ] Test the complete lesson creation flow with various video formats and sizes
- [ ] Create Playwright E2E tests for the lesson creation flow

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

## Priority 2: Stripe Connect Integration

### Issue Description
The Stripe Connect flow appears to complete successfully on Stripe's side, but the application database is not being properly updated. This results in the Stripe Account Status section showing as incomplete when it should be complete.

### Technical Analysis
- The redirect from Stripe back to the application is working
- The database update after successful Stripe onboarding is failing
- This affects creator payouts and the ability to sell lessons

### Root Cause Analysis
The issue appears to be that the Stripe Connect flow completes successfully on Stripe's side, but our database isn't being updated. This could be due to:

1. **Webhook handling issues**: The Stripe webhook might not be properly configured or processed
2. **Database update failure**: The database update operation might be failing in `app/api/webhooks/stripe/route.ts`
3. **Race condition**: There might be a timing issue between the redirect and webhook processing

### Key Files to Examine
- `app/api/stripe/connect/callback/route.ts` - Handles redirect from Stripe
- `app/api/webhooks/stripe/route.ts` - Processes Stripe webhooks
- `app/components/ui/stripe-account-status.tsx` - Displays account status
- `app/components/ui/stripe-connect-button.tsx` - Initiates connection flow
- `app/services/stripe.ts` - Stripe service implementation
- `app/components/profile/payment-settings.tsx` - Profile payment settings

### Detailed Investigation Steps
1. **Verify Webhook Configuration**:
   - Check if the Stripe webhook is properly configured in the Stripe dashboard
   - Verify the webhook secret is correctly set in the environment
   - Check if the webhook endpoint is accessible from Stripe

2. **Examine Webhook Handler**:
   - Review `app/api/webhooks/stripe/route.ts` to see how it processes account updates
   - Check if it's properly verifying the webhook signature
   - Verify it's updating the database correctly

3. **Analyze Callback Handler**:
   - Review `app/api/stripe/connect/callback/route.ts` to see how it handles the redirect
   - Check if it's properly updating the database
   - Verify it's handling errors correctly

4. **Test Database Updates**:
   - Create a test script to verify database updates work correctly
   - Check if there are any permission issues with the database

### Action Items
- [ ] Debug the Stripe webhook handling for account updates
- [ ] Verify Stripe Connect API integration is correctly implemented
- [ ] Ensure database updates occur after successful Stripe onboarding
- [ ] Implement better error handling and logging for Stripe Connect flow
- [ ] Add status checks to verify Stripe account status is correctly reflected
- [ ] Implement a reconciliation process to periodically sync Stripe account status
- [ ] Create a background job to detect and fix inconsistencies
- [ ] Test the complete Stripe Connect flow end-to-end
- [ ] Verify international Stripe Connect accounts work properly
- [ ] Implement proper error messaging for users if Stripe Connect fails
- [ ] Create Playwright E2E tests for the Stripe Connect flow

### Proposed Solution
1. **Enhance Stripe Service** (`app/services/stripe.ts`):
   - Add robust initialization with validation
   - Implement retry logic for transient failures
   - Add detailed error logging
   - Create methods to verify account status

2. **Improve Webhook Handler** (`app/api/webhooks/stripe/route.ts`):
   - Add proper signature verification
   - Implement idempotent processing
   - Add detailed logging
   - Create a reconciliation mechanism

3. **Update Callback Handler** (`app/api/stripe/connect/callback/route.ts`):
   - Improve error handling
   - Add database update verification
   - Implement user feedback

4. **Add Status Reconciliation**:
   - Create a background job to periodically sync Stripe account status
   - Implement a manual reconciliation endpoint for admin use

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

#### Action Items
- [ ] Add validation to prevent setting prices > 0 without a verified Stripe account
- [ ] Display appropriate error messages to guide users to complete Stripe onboarding
- [ ] Implement server-side validation as a fallback security measure
- [ ] Test this validation with various user scenarios
- [ ] Create unit tests for this validation logic

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

#### Action Items
- [ ] Fix toast notification auto-dismiss functionality
- [ ] Ensure all toasts have appropriate timeout settings
- [ ] Implement a cleanup mechanism for stale toasts
- [ ] Test toast behavior across different actions
- [ ] Create component tests for toast behavior

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

#### Action Items
- [ ] Fix header collapse behavior on page navigation
- [ ] Use Next.js router events to detect navigation
- [ ] Ensure mobile responsiveness of header
- [ ] Test header behavior across different devices and screen sizes
- [ ] Create component tests for header navigation behavior

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
   - [ ] Create lesson with title, description, and price
   - [ ] Upload video content successfully
   - [ ] Verify video processing completes
   - [ ] Publish lesson
   - [ ] Verify lesson appears in marketplace
   - [ ] Create Playwright E2E test for this flow

2. **Complete Purchase Flow**
   - [ ] Browse lessons as a student
   - [ ] Purchase a lesson with Stripe
   - [ ] Verify access to purchased content
   - [ ] Verify purchase records in database
   - [ ] Create Playwright E2E test for this flow

3. **Complete Payout Flow**
   - [ ] Verify creator earnings are calculated correctly
   - [ ] Verify Stripe Connect account receives funds
   - [ ] Test international payment scenarios
   - [ ] Create integration tests for payout calculations

4. **Error Handling**
   - [ ] Verify appropriate error messages for all failure scenarios
   - [ ] Test recovery from service failures (Mux, Stripe)
   - [ ] Ensure no unhandled exceptions in production environment
   - [ ] Implement structured error logging

## Testing Strategy

To ensure all fixes work correctly, we'll need:

1. **Unit Tests**:
   - Test Mux service initialization and error handling
   - Test Stripe service initialization and webhook processing
   - Test form validation for lesson creation
   - Add tests for `app/services/mux/index.ts` and `app/services/stripe.ts`

2. **Integration Tests**:
   - Test Mux upload flow end-to-end
   - Test Stripe Connect flow end-to-end
   - Test lesson creation and purchase flow
   - Add tests for `app/api/mux/upload-url/route.ts` and `app/api/stripe/connect/callback/route.ts`

3. **End-to-End Tests**:
   - Create Playwright tests for the complete lesson creation flow
   - Create Playwright tests for the complete purchase flow
   - Create Playwright tests for the Stripe Connect flow
   - Add tests to `app/__tests__/` directory

## Environment Verification

Before launch, verify:

- [ ] All required environment variables are set in production
- [ ] Create a startup validation script that checks all required variables
- [ ] Stripe webhook endpoints are correctly configured
- [ ] Mux API keys and configuration are correct
- [ ] Implement health check endpoints for all external services
- [ ] Database access and permissions are properly set up
- [ ] No development/testing artifacts remain in production code
- [ ] Create a pre-deployment checklist script

## Implementation Timeline

Given the deadline (tomorrow night), here's a proposed timeline:

1. **Morning (First 4 hours)**:
   - Fix Mux integration issue (Priority 1)
   - Focus on `app/services/mux/index.ts` and `app/api/mux/upload-url/route.ts`
   - Add comprehensive tests for the fix
   - Deploy and verify the fix works in the staging environment

2. **Afternoon (Next 4 hours)**:
   - Fix Stripe Connect integration (Priority 2)
   - Focus on `app/api/webhooks/stripe/route.ts` and `app/api/stripe/connect/callback/route.ts`
   - Add comprehensive tests for the fix
   - Deploy and verify the fix works in the staging environment

3. **Evening (Final 4 hours)**:
   - Fix the smaller bugs (Priority 3)
   - Focus on `app/components/ui/lesson-form.tsx`, `app/components/ui/toast.tsx`, and `app/components/ui/header.tsx`
   - Perform final testing of all fixes
   - Deploy to production and monitor for issues

## Monitoring and Rollback Plan

1. **Monitoring**:
   - Set up detailed logging for all fixed components
   - Create alerts for any failures in the fixed components
   - Monitor key metrics (lesson creation, purchases, etc.)

2. **Rollback Plan**:
   - Create a snapshot of the current production environment
   - Prepare rollback scripts for each fix
   - Define clear criteria for when to roll back

## Sustainable Solutions

To prevent these issues from recurring in the future, we should implement:

### 1. Comprehensive Testing Strategy
- [ ] End-to-end tests for all critical user flows
- [ ] Integration tests for API routes and service interactions
- [ ] Unit tests for business logic and validation
- [ ] Visual regression tests for UI components
- [ ] Set up CI/CD pipeline to run tests before deployment

### 2. Robust Error Handling
- [ ] Implement consistent error handling patterns across the application
- [ ] Add retry mechanisms for transient failures
- [ ] Create circuit breakers for external service failures
- [ ] Implement graceful degradation for non-critical features

### 3. Monitoring and Alerting
- [ ] Set up structured logging for all service interactions
- [ ] Implement real-time alerts for critical failures
- [ ] Create dashboards for key metrics (lesson creation, purchases)
- [ ] Monitor third-party service health (Stripe, Mux)

### 4. Data Consistency Checks
- [ ] Implement background jobs to verify database consistency
- [ ] Create reconciliation processes for external services
- [ ] Add data validation at all input points
- [ ] Implement database migration tests

## Additional Considerations

- [ ] Perform final security review
- [ ] Verify all API endpoints have proper authentication
- [ ] Check for any performance bottlenecks
- [ ] Ensure all critical user journeys have been tested
- [ ] Prepare monitoring and error tracking for post-launch issues
- [ ] Create runbooks for common operational tasks
- [ ] Document troubleshooting procedures for known issues

## Launch Readiness Criteria

The platform will be considered ready for launch when:
1. All Priority 1 and 2 items are resolved
2. At least 90% of Priority 3 items are resolved
3. All core user flows (create, purchase, payout) work end-to-end
4. No critical security issues remain
5. All environment validations pass
6. End-to-end tests for critical flows succeed

## Development Environment Recommendations

While using production environment variables during development helps ensure things work in production, it also carries risks. Consider:

1. Creating a staging environment that mirrors production
2. Using test accounts for third-party services in development
3. Implementing feature flags to safely roll out changes
4. Setting up separate webhook endpoints for development/staging/production

---

This checklist will be updated as issues are resolved or new issues are discovered during the pre-launch testing phase.
