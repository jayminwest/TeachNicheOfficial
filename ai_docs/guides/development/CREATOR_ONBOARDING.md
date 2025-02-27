# Creator Onboarding Guide

This guide outlines the process for onboarding new creators to the Teach Niche platform.

## Overview

The creator onboarding process consists of three main steps:
1. Account creation and profile setup
2. Bank account setup for receiving payouts
3. Creating and publishing their first lesson

## Account Creation and Profile Setup

### Implementation Details

The account creation flow is handled by:
- `app/components/ui/sign-up.tsx` - Sign-up form component
- `app/services/auth.ts` - Authentication service
- `app/profile/components/profile-form.tsx` - Profile editing component

### Required Profile Information

Creators must provide:
- Full name
- Email address
- Profile picture (optional but recommended)
- Bio (optional but recommended)
- Social media handles (optional)

## Bank Account Setup

### Implementation Details

The bank account setup is handled by:
- `app/components/ui/bank-account-form.tsx` - Bank account form component
- `app/services/payouts.ts` - Payout service for managing bank accounts
- `/api/payouts/bank-account` - API endpoint for bank account management

### Bank Account Collection

We use Stripe Elements to securely collect bank account information:

```typescript
import { BankAccountForm } from '@/app/components/ui/bank-account-form';

// In your component
<BankAccountForm 
  onSuccess={handleBankAccountSuccess} 
  onError={handleBankAccountError} 
/>
```

### Security Considerations

- Bank account information is never stored directly in our database
- We store only the Stripe bank account token and last four digits
- All bank account collection is done through Stripe Elements
- Bank account validation is handled by Stripe

## Earnings and Payouts

### Earnings Dashboard

Creators can view their earnings in the dashboard:
- Total earnings to date
- Pending earnings (not yet paid out)
- Completed payouts
- Earnings by lesson

### Payout Schedule

- Payouts are processed on a [weekly/monthly] basis
- Minimum payout amount: $50
- Payouts are sent directly to the creator's bank account
- Creators receive email notifications when payouts are processed

## Creating First Lesson

### Implementation Details

The lesson creation flow is handled by:
- `app/components/ui/lesson-form.tsx` - Lesson creation form
- `app/services/lessons.ts` - Lesson management service
- `/api/lessons` - API endpoints for lesson CRUD operations

### Required Lesson Information

Creators must provide:
- Lesson title
- Description
- Price
- Video content
- Thumbnail image (optional)
- Categories/tags (optional)

## Testing the Onboarding Flow

To test the complete creator onboarding flow:

1. Create a test user account
2. Complete the profile setup
3. Add a test bank account using Stripe test mode
4. Create a test lesson
5. Make a test purchase using Stripe test cards
6. Verify earnings are recorded correctly
7. Test the payout process using the admin tools

## Troubleshooting

### Common Issues

1. **Bank Account Validation Failures**
   - Ensure the routing and account numbers are valid test numbers
   - Check that the account holder name matches the profile name

2. **Lesson Creation Issues**
   - Verify video upload is working correctly
   - Check that all required fields are completed

3. **Payout Processing Issues**
   - Verify the bank account is properly set up
   - Check for minimum payout threshold

## Reference

- [Stripe Bank Account Testing](https://stripe.com/docs/testing#bank-accounts)
- [Stripe Elements Documentation](https://stripe.com/docs/elements)
- [Stripe Payouts API](https://stripe.com/docs/api/payouts)

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
