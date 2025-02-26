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
- Implement a periodic payout system to creators using Stripe Payouts
- Centralize tax collection and compliance
- Simplify creator onboarding to just providing bank account details

## Affected Components

### Primary Files
- `app/services/stripe.ts` - Needs complete refactoring to use standard Stripe and implement payouts
- `app/components/ui/stripe-connect-button.tsx` - Should be removed
- Database schema - Requires new tables for earnings tracking and payouts

### Secondary Files
- `app/dashboard/page.tsx` - Update to show earnings instead of Stripe status
- Payment flow components - Update to use new payment model
- Creator profile components - Replace Stripe Connect with bank account collection

## Implementation Requirements

1. **Payment Processing**
   - Modify payment flow to process all transactions through Teach Niche's Stripe account
   - Update database schema to track creator earnings per transaction
   - Implement revenue sharing calculations based on platform fee percentage
   - Add metadata to Stripe payments to track creator attribution

2. **Payout System**
   - Create new database tables for tracking creator earnings and payouts
   - Implement periodic (weekly/monthly) payout processing using Stripe Payouts API
   - Add secure bank account collection for creators using Stripe Elements
   - Store bank tokens securely for recurring payouts

3. **Creator Experience**
   - Remove Stripe Connect onboarding requirements
   - Add earnings dashboard showing pending and processed payouts
   - Implement simple bank account setup flow
   - Update terms of service to reflect new payment model

4. **Admin Tools**
   - Create admin interface for managing payouts
   - Implement reporting for financial reconciliation
   - Add tools for handling disputes and refunds

## Technical Implementation

### New Database Tables
- `creator_earnings` - Track earnings per transaction
- `creator_payouts` - Track payout history
- `creator_payout_methods` - Store creator bank account tokens

### New Services
- `earnings.ts` - For tracking and calculating creator earnings
- `payouts.ts` - For processing periodic payouts to creators

### Payment Flow
1. User purchases lesson → Payment processed through Teach Niche's Stripe account
2. System calculates creator's share and platform fee
3. Earnings recorded in database with 'pending' status
4. Periodic job processes payouts to creators' bank accounts
5. Earnings records updated to 'paid' status

## Testing Requirements

1. **Payment Flow Testing**
   - Verify correct payment processing
   - Ensure proper revenue sharing calculations
   - Test refund scenarios and earnings adjustments

2. **Payout Testing**
   - Verify correct earnings accumulation
   - Test payout processing to bank accounts
   - Validate reporting accuracy
   - Test error handling for failed payouts

3. **End-to-End Testing**
   - Complete purchase flow with revenue sharing
   - Full payout cycle from purchase to creator payment
   - Refund handling and balance adjustments

## User Impact

### Benefits
- Simplified creator onboarding (just bank account details required)
- Reduced tax complexity for creators
- More consistent payment experience
- Centralized financial reporting for creators
- No need to manage separate Stripe accounts

### Potential Concerns
- Delayed access to funds (periodic payouts vs. immediate)
- Need for clear communication about the transition
- Secure handling of banking information

## Security Considerations
- Use Stripe Elements for secure collection of banking information
- Implement proper access controls for financial data
- Store only bank tokens, not actual account numbers
- Regular security audits of payout processes

## Implementation Plan

1. **Phase 1: Design and Planning**
   - Finalize database schema changes
   - Design payout processing workflow
   - Update financial models and fee structure

2. **Phase 2: Core Implementation**
   - Implement standard Stripe integration
   - Create earnings tracking system
   - Develop bank account collection flow
   - Implement payout processing service

3. **Phase 3: UI Updates**
   - Remove Stripe Connect components
   - Add earnings dashboard for creators
   - Implement bank account management interface

4. **Phase 4: Testing and Deployment**
   - Comprehensive testing of all payment flows
   - Beta testing with select creators
   - Phased rollout to all users

## GitHub CLI Command

```bash
# Create the issue and add it to the project
gh issue create --title "Transition to Merchant of Record Payment Model" --body-file ai_docs/issues/2025-02-26-037-transition-to-merchant-of-record-payment-model.md --label "enhancement,high-priority" --assignee "@me"
```

This issue represents a significant architectural change that will simplify the creator experience while giving Teach Niche more control over the payment process. By leveraging Stripe for both payment collection and creator payouts, we can create a seamless financial experience for all parties.
