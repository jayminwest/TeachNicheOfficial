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

### Key Files to Examine
- `app/api/mux/upload-url/route.ts` - Contains the error in the Uploads API call
- `app/services/mux/index.ts` - Likely contains the Mux SDK initialization
- `app/services/mux.ts` - Main service implementation for Mux
- `app/components/ui/video-uploader.tsx` - Client-side implementation of video upload
- Environment variables configuration for Mux credentials

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

## Priority 2: Stripe Connect Integration

### Issue Description
The Stripe Connect flow appears to complete successfully on Stripe's side, but the application database is not being properly updated. This results in the Stripe Account Status section showing as incomplete when it should be complete.

### Technical Analysis
- The redirect from Stripe back to the application is working
- The database update after successful Stripe onboarding is failing
- This affects creator payouts and the ability to sell lessons

### Key Files to Examine
- `app/api/stripe/connect/callback/route.ts` - Handles redirect from Stripe
- `app/api/webhooks/stripe/route.ts` - Processes Stripe webhooks
- `app/components/ui/stripe-account-status.tsx` - Displays account status
- `app/components/ui/stripe-connect-button.tsx` - Initiates connection flow
- `app/services/stripe.ts` - Stripe service implementation
- `app/components/profile/payment-settings.tsx` - Profile payment settings

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

## Priority 3: Various Smaller Bugs

### 3.1 Paid Lessons Without Stripe Account

#### Issue Description
Users can currently create paid lessons without having a confirmed Stripe Connect account.

#### Key Files to Examine
- `app/components/ui/lesson-form.tsx` - Form for creating/editing lessons

#### Action Items
- [ ] Add validation to prevent setting prices > 0 without a verified Stripe account
- [ ] Display appropriate error messages to guide users to complete Stripe onboarding
- [ ] Implement server-side validation as a fallback security measure
- [ ] Test this validation with various user scenarios
- [ ] Create unit tests for this validation logic

### 3.2 Toast Notification Issues

#### Issue Description
Toast notifications don't disappear automatically, leading to a cluttered UI.

#### Key Files to Examine
- `app/components/ui/toast.tsx` - Toast component implementation
- `app/components/ui/use-toast.ts` - Toast hook implementation

#### Action Items
- [ ] Fix toast notification auto-dismiss functionality
- [ ] Ensure all toasts have appropriate timeout settings
- [ ] Implement a cleanup mechanism for stale toasts
- [ ] Test toast behavior across different actions
- [ ] Create component tests for toast behavior

### 3.3 Header Navigation Issues

#### Issue Description
The header menu doesn't collapse automatically when navigating to a new page.

#### Key Files to Examine
- `app/components/ui/header.tsx` - Header component implementation

#### Action Items
- [ ] Fix header collapse behavior on page navigation
- [ ] Use Next.js router events to detect navigation
- [ ] Ensure mobile responsiveness of header
- [ ] Test header behavior across different devices and screen sizes
- [ ] Create component tests for header navigation behavior

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
