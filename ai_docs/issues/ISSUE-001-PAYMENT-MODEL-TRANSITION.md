# Issue Report: Transition to Merchant of Record Payment Model

## Issue Description

Currently, our platform uses Stripe Connect which requires creators to set up and manage their own Stripe accounts. This creates unnecessary complexity for creators and increases the technical burden on our platform. We need to transition to a merchant of record model where Teach Niche handles all payment processing and distributes earnings to creators, similar to how Gumroad operates.

## Technical Analysis

### Current Implementation
- Uses Stripe Connect for direct creator payments
- Requires creators to complete Stripe onboarding
- Creators handle their own tax compliance
- Complex integration with multiple Stripe accounts

### Proposed Changes
- Transition to standard Stripe (not Connect)
- Teach Niche becomes the merchant of record
- Implement a periodic payout system to creators
- Centralize tax collection and compliance
- Simplify creator onboarding

## Affected Components

### Primary Files
- `app/services/stripe.ts` - Needs complete refactoring to use standard Stripe
- `app/components/ui/stripe-connect-button.tsx` - Should be removed
- Database schema - Requires new tables for earnings tracking and payouts

### Secondary Files
- `app/dashboard/page.tsx` - Update to show earnings instead of Stripe status
- Payment flow components - Update to use new payment model
- Creator profile components - Remove Stripe account requirements

## Implementation Requirements

1. **Payment Processing**
   - Modify payment flow to process all transactions through Teach Niche's Stripe account
   - Update database schema to track creator earnings per transaction
   - Implement revenue sharing calculations based on platform fee percentage

2. **Payout System**
   - Create new database tables for tracking creator earnings and payouts
   - Implement periodic (weekly/monthly) payout processing
   - Add payout method selection for creators (bank account/PayPal)

3. **Creator Experience**
   - Remove Stripe Connect onboarding requirements
   - Add earnings dashboard showing pending and processed payouts
   - Update terms of service to reflect new payment model

4. **Admin Tools**
   - Create admin interface for managing payouts
   - Implement reporting for financial reconciliation
   - Add tools for handling disputes and refunds

## Testing Requirements

1. **Payment Flow Testing**
   - Verify correct payment processing
   - Ensure proper revenue sharing calculations
   - Test refund scenarios

2. **Payout Testing**
   - Verify correct earnings accumulation
   - Test payout processing to different payout methods
   - Validate reporting accuracy

3. **End-to-End Testing**
   - Complete purchase flow with revenue sharing
   - Full payout cycle from purchase to creator payment
   - Refund handling and balance adjustments

## User Impact

### Benefits
- Simplified creator onboarding (no Stripe account required)
- Reduced tax complexity for creators
- More consistent payment experience
- Potential for more flexible payout options

### Potential Concerns
- Delayed access to funds (periodic payouts vs. immediate)
- Less direct control over payment processing
- Need for clear communication about the transition

## Security Considerations
- Increased responsibility for handling creator banking information
- Need for secure storage of payout details
- Higher security requirements as all funds flow through our platform

## Implementation Plan

1. **Phase 1: Design and Planning**
   - Finalize database schema changes
   - Design payout processing workflow
   - Update financial models and fee structure

2. **Phase 2: Core Implementation**
   - Implement standard Stripe integration
   - Create earnings tracking system
   - Develop payout processing service

3. **Phase 3: UI Updates**
   - Remove Stripe Connect components
   - Add earnings dashboard for creators
   - Implement payout method selection

4. **Phase 4: Testing and Deployment**
   - Comprehensive testing of all payment flows
   - Beta testing with select creators
   - Phased rollout to all users

## GitHub CLI Command

```bash
gh issue create --title "Transition to Merchant of Record Payment Model" --body-file ai_docs/issues/ISSUE-001-PAYMENT-MODEL-TRANSITION.md --label "enhancement" --assignee "@me" --project "Launch"
```

Alternatively, to create the high-priority label first and then create the issue:

```bash
gh label create high-priority --color "#ff0000" --description "Requires immediate attention"
gh issue create --title "Transition to Merchant of Record Payment Model" --body-file ai_docs/issues/ISSUE-001-PAYMENT-MODEL-TRANSITION.md --label "enhancement,high-priority" --assignee "@me" --project "Launch"
```

This issue represents a significant architectural change that will simplify the creator experience while giving Teach Niche more control over the payment process. The transition will require careful planning and communication with existing creators.
