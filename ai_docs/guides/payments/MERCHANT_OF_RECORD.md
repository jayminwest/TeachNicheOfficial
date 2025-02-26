# Merchant of Record Payment Model

## Overview

Teach Niche operates as the **Merchant of Record (MoR)** for all transactions on the platform. This means that Teach Niche, not individual creators, is the entity legally selling the content to customers. This model simplifies the creator experience while providing a consistent payment process for customers.

## How It Works

### Payment Flow

1. **Purchase**: When a customer purchases a lesson, they pay Teach Niche directly.
2. **Revenue Sharing**: The system automatically calculates the creator's share based on our revenue sharing agreement.
3. **Earnings Tracking**: Creator earnings are recorded in our database with a 'pending' status.
4. **Periodic Payouts**: On a regular schedule (weekly/monthly), Teach Niche processes payouts to creators.
5. **Earnings Update**: After successful payout, earnings records are updated to 'paid' status.

### Benefits for Creators

- **Simplified Onboarding**: No need to create and manage a Stripe Connect account
- **Reduced Administrative Burden**: Teach Niche handles tax collection and compliance
- **Consolidated Financial Reporting**: All earnings are tracked in one place
- **Predictable Payouts**: Regular payment schedule
- **Lower Technical Complexity**: No need to manage payment processing infrastructure

### Benefits for Teach Niche

- **Consistent Customer Experience**: All payments handled through a single system
- **Simplified Refund Processing**: Direct control over refunds
- **Reduced Support Burden**: Fewer payment-related support issues
- **Better Financial Controls**: Centralized revenue management
- **Streamlined Compliance**: Consolidated tax and regulatory compliance

## Creator Setup Process

To receive payments as a creator:

1. Navigate to your creator dashboard
2. Select "Payment Settings"
3. Enter your bank account information using our secure form
4. Verify your tax information
5. Set up is complete - you'll receive payouts according to the schedule

## Payout Schedule and Thresholds

- **Payout Frequency**: [Weekly/Monthly] payouts
- **Minimum Payout Threshold**: $[Amount] (earnings below this amount roll over to the next payout period)
- **Processing Time**: 3-5 business days for funds to reach your bank account after payout initiation

## Revenue Sharing Model

- **Creator Share**: [X]% of the lesson price
- **Platform Fee**: [Y]% of the lesson price
- **Payment Processing Fee**: Absorbed by Teach Niche

## Handling Refunds and Disputes

When a refund is processed:

1. If the creator's earnings have not yet been paid out, the earnings record is adjusted
2. If the creator's earnings have already been paid out, the refund amount is deducted from future earnings
3. Creators are notified of all refunds through the dashboard and email notifications

## Tax Considerations

As the Merchant of Record, Teach Niche:

1. Collects and remits sales tax where applicable
2. Provides tax documentation to creators for their earnings
3. Issues appropriate tax forms (e.g., 1099 forms in the US) to creators who meet reporting thresholds

## Security Measures

- Bank account information is collected and stored securely using Stripe's API
- Only tokenized bank information is stored in our system
- All financial data is encrypted and access is strictly controlled
- Regular security audits are conducted on all payment-related systems

## Technical Implementation

The merchant of record model is implemented using:

- Standard Stripe integration (not Stripe Connect)
- Custom database tables for tracking earnings and payouts
- Secure API endpoints for bank account management
- Automated payout processing system
- Comprehensive financial reconciliation tools

## Monitoring and Support

- All payment transactions are logged and monitored
- Automated alerts for failed payments or payouts
- Dedicated support for payment-related issues
- Regular financial reconciliation processes

For technical implementation details, please refer to the [Payment System Technical Documentation](../reference/PAYMENT_SYSTEM.md).
