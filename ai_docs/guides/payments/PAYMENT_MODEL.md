# Payment Model

This document outlines the payment model used in the Teach Niche platform.

## Overview

Teach Niche operates as a merchant of record (MoR), handling all payment processing and distributing earnings to creators. This model simplifies the creator experience by eliminating the need for creators to manage their own payment processing accounts.

## Revenue Sharing

The platform uses a straightforward revenue sharing model:

- **Creator Share: 85%** of the lesson price
- **Platform Fee: 15%** of the lesson price
- **Processing Fees:** Paid by buyers in addition to the lesson price

## Example Transaction

For a lesson priced at $20.00:
- Buyer pays: $20.00 + processing fees (approximately $0.88)
- Creator earns: $17.00 (85% of $20.00)
- Platform retains: $3.00 (15% of $20.00)

## Payment Flow

1. **Purchase:**
   - Buyer initiates purchase of a lesson
   - Checkout shows base price + processing fees
   - Payment is processed through Teach Niche's Stripe account

2. **Earnings Recording:**
   - System calculates creator's share (85%)
   - Earnings are recorded in the creator's account
   - Earnings status is set to "pending"

3. **Payout Processing:**
   - Accumulated earnings are paid out on a regular schedule
   - Minimum payout threshold applies
   - Payouts are processed via Stripe Payouts API
   - Earnings status is updated to "paid"

## Creator Experience

Creators benefit from:
- Simple onboarding (just bank account details required)
- No need to manage payment processing accounts
- Transparent earnings tracking
- Regular, predictable payouts
- Higher revenue share (85%) than industry standard

## Technical Implementation

The payment model is implemented through:
- `app/services/stripe.ts` - Core payment processing
- `app/services/earnings.ts` - Earnings calculation and tracking
- `app/services/payouts.ts` - Payout processing
- `app/components/ui/lesson-checkout.tsx` - Buyer-facing checkout experience

## Constants

```typescript
// Payment model constants
export const PAYMENT_CONSTANTS = {
  CREATOR_SHARE_PERCENTAGE: 0.85, // 85%
  PLATFORM_FEE_PERCENTAGE: 0.15, // 15%
  STRIPE_FEE_PERCENTAGE: 0.029, // 2.9%
  STRIPE_FEE_FIXED: 0.30, // $0.30
};
```

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-26 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
