# Manual Stripe Configuration for Merchant of Record Transition

## Issue Description

As part of our transition from Stripe Connect to a merchant of record payment model (issue #037), several manual configuration steps must be completed in the Stripe Dashboard. These changes cannot be made programmatically and require administrative access to our Stripe account.

## Required Manual Configuration Steps

### 1. Update Stripe Account Settings

#### Business Information
- Log in to the [Stripe Dashboard](https://dashboard.stripe.com/)
- Navigate to **Settings → Business settings**
- Update business information to reflect our role as direct seller
- Verify business address is correct (important for tax purposes)

#### Branding Settings
- Go to **Settings → Branding**
- Update business name and logo if needed
- Customize appearance of receipts and invoices
- Ensure checkout pages reflect our brand as the merchant

### 2. Configure Tax Settings

#### Tax Registration
- Navigate to **Settings → Tax settings**
- Add tax registration numbers for relevant jurisdictions
- Configure automatic tax calculation:
  - Go to **Tax settings → Automatic tax calculation**
  - Enable automatic tax calculation
  - Select jurisdictions where we operate

#### Tax Reporting
- Set up tax categories for our products:
  - Navigate to **Products** section
  - Update existing products to include proper tax categories
  - For digital products like online lessons, ensure they're properly categorized

### 3. Update Payout Settings

#### Payout Schedule
- Go to **Settings → Payout settings**
- Configure payout schedule (daily, weekly, monthly)
- Verify bank account information is correct

#### Balance Management
- Consider cash flow needs for creator payouts
- Determine if payout timing adjustments are needed to ensure sufficient balance

### 4. Configure Webhook Endpoints

#### Update Webhook Configuration
- Navigate to **Developers → Webhooks**
- Update existing webhooks or create new ones to handle:
  - `payment_intent.succeeded` (to record creator earnings)
  - `charge.refunded` (to adjust creator earnings)
  - `payout.created` and `payout.paid` (to track payouts to creators)
- Ensure webhook secret is securely stored in environment variables

### 5. Set Up Financial Reporting

#### Custom Reports
- Go to **Reports** section
- Set up custom reports for:
  - Revenue by product/lesson
  - Platform fees collected
  - Creator earnings
  - Payout reconciliation

#### Export Settings
- Configure regular exports of transaction data
- Set up automated reports for the finance team

### 6. Update Customer Communication

#### Email Templates
- Navigate to **Settings → Customer emails**
- Update email templates to reflect that purchases are made directly from our business
- Customize receipts to include creator information

#### Customer Portal
- If using Customer Portal, update its configuration
- Customize appearance and available actions

### 7. Legal and Compliance Updates

#### Terms of Service
- Update Terms of Service to reflect our role as merchant of record
- Clearly define relationship between platform, creators, and customers

#### Privacy Policy
- Update Privacy Policy to address:
  - How we handle creator banking information
  - Our role in processing payments
  - Tax information collection and sharing

#### Creator Agreements
- Create or update creator agreements to reflect:
  - New payment structure
  - Payout terms and schedule
  - Tax implications

### 8. Testing in Stripe Test Mode

Before going live:
- Switch to Stripe test mode
- Create test products and process test payments
- Test complete flow from purchase to creator payout
- Verify tax calculations are correct
- Test refund scenarios and ensure creator earnings are properly adjusted

### 9. Communication Plan for Creators

- Prepare detailed documentation explaining:
  - The new payment model
  - How to set up bank account information
  - Payout schedule and expectations
  - Tax implications of the change

- Schedule information sessions or webinars to:
  - Walk creators through the new system
  - Address questions and concerns
  - Demonstrate the new earnings dashboard

## Acceptance Criteria

- [ ] All Stripe account settings updated to reflect merchant of record status
- [ ] Tax settings properly configured for all relevant jurisdictions
- [ ] Webhook endpoints updated and tested
- [ ] Custom financial reports created
- [ ] Email templates and customer communications updated
- [ ] Legal documents revised and published
- [ ] Complete testing performed in Stripe test mode
- [ ] Creator communication materials prepared

## Dependencies

- Depends on the architectural decisions made in issue #037
- Must be completed before deploying the new payment model to production

## GitHub CLI Command

```bash
# Create the issue and add it to the project
gh issue create --title "Manual Stripe Configuration for Merchant of Record Transition" --body-file ai_docs/issues/2025-02-26-038-manual-stripe-configuration-for-merchant-model.md --label "task,high-priority" --assignee "@me"
```

This issue tracks the manual configuration steps required in the Stripe Dashboard to support our transition to a merchant of record payment model. These steps must be carefully completed and documented to ensure a smooth transition.
