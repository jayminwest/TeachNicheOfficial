# Payment System Technical Documentation

## System Architecture

The payment system consists of several components working together to process payments, track creator earnings, and handle payouts.

### Core Components

1. **Payment Processing Service**
   - Handles customer payments through Stripe
   - Calculates revenue sharing
   - Records transaction details

2. **Earnings Tracking Service**
   - Records creator earnings per transaction
   - Maintains earnings status (pending, paid, refunded)
   - Provides earnings reporting

3. **Payout Processing Service**
   - Identifies creators eligible for payouts
   - Processes payouts through Stripe
   - Updates earnings records after successful payouts

4. **Bank Account Management**
   - Securely collects and stores creator bank information
   - Validates bank account details
   - Manages bank account updates

## Database Schema

### Creator Earnings Table

```sql
CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payout_id UUID REFERENCES creator_payouts(id),
  UNIQUE(purchase_id, creator_id)
);
```

### Creator Payouts Table

```sql
CREATE TABLE creator_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payout_method_id UUID REFERENCES creator_payout_methods(id),
  stripe_payout_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT
);
```

### Creator Payout Methods Table

```sql
CREATE TABLE creator_payout_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  bank_token VARCHAR(255) NOT NULL,
  last_four VARCHAR(4),
  bank_name VARCHAR(255),
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, bank_token)
);
```

## API Endpoints

### Payment Endpoints

- `POST /api/payments/create-checkout`
  - Creates a Stripe checkout session for lesson purchase
  - Records purchase intent in database

- `POST /api/webhooks/stripe`
  - Handles Stripe webhook events
  - Updates purchase status
  - Records creator earnings

### Bank Account Endpoints

- `POST /api/payouts/bank-account`
  - Securely collects and stores bank account information
  - Validates bank account details

- `GET /api/payouts/bank-account`
  - Retrieves masked bank account information

- `DELETE /api/payouts/bank-account/:id`
  - Removes bank account information

### Payout Endpoints

- `GET /api/payouts/earnings`
  - Retrieves creator earnings information
  - Supports filtering by status and date range

- `GET /api/payouts/history`
  - Retrieves payout history

### Admin Endpoints

- `POST /api/admin/payouts/process`
  - Triggers payout processing
  - Restricted to admin users

- `GET /api/admin/payouts/pending`
  - Lists pending payouts
  - Restricted to admin users

## Implementation Details

### Payment Processing

1. Customer initiates purchase through checkout
2. System creates Stripe checkout session with metadata:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     line_items: [{
       price_data: {
         currency: 'usd',
         product_data: {
           name: lesson.title,
         },
         unit_amount: lesson.price * 100,
       },
       quantity: 1,
     }],
     mode: 'payment',
     success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lesson.id}/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lesson.id}`,
     metadata: {
       lessonId: lesson.id,
       creatorId: lesson.creator_id,
       purchaseId: purchaseId,
     },
   });
   ```

3. On successful payment (webhook event), system:
   - Updates purchase status
   - Calculates creator earnings
   - Records earnings in database

### Earnings Calculation

```typescript
function calculateEarnings(amount: number, platformFeePercent: number) {
  const platformFee = (amount * platformFeePercent) / 100;
  const creatorEarnings = amount - platformFee;
  
  return {
    platformFee: parseFloat(platformFee.toFixed(2)),
    creatorEarnings: parseFloat(creatorEarnings.toFixed(2))
  };
}
```

### Payout Processing

1. Scheduled job identifies creators with pending earnings above threshold
2. System creates Stripe payout for each eligible creator
3. On successful payout, system updates earnings records to 'paid' status

```typescript
async function processCreatorPayout(creatorId: string, amount: number, bankToken: string) {
  try {
    // Create Stripe payout
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: bankToken,
      metadata: {
        creatorId,
        payoutId: payoutId
      }
    });
    
    // Update payout record with Stripe payout ID
    await updatePayoutRecord(payoutId, {
      stripe_payout_id: payout.id,
      status: 'processing'
    });
    
    return payout.id;
  } catch (error) {
    // Handle error and update payout record
    await updatePayoutRecord(payoutId, {
      status: 'failed',
      error_message: error.message
    });
    throw error;
  }
}
```

## Security Considerations

1. **PCI Compliance**
   - Use Stripe Elements for collecting payment information
   - Never store raw credit card data

2. **Bank Account Security**
   - Use Stripe's API to collect and tokenize bank account information
   - Store only bank tokens, not actual account numbers

3. **Access Control**
   - Implement strict permission checks for all financial endpoints
   - Log all access to financial data

4. **Data Protection**
   - Encrypt all financial data at rest
   - Implement proper data retention policies

5. **Audit Trail**
   - Maintain comprehensive logs of all financial transactions
   - Record all changes to financial records

## Error Handling

1. **Payment Failures**
   - Notify customer of failed payment
   - Provide clear instructions for retry

2. **Payout Failures**
   - Automatically retry failed payouts with exponential backoff
   - Alert administrators of persistent failures
   - Notify creators of payout issues

3. **Reconciliation Errors**
   - Implement automated detection of discrepancies
   - Provide tools for manual reconciliation

## Monitoring

1. **Real-time Alerts**
   - Configure alerts for payment processing errors
   - Monitor payout success rates

2. **Financial Dashboards**
   - Track key metrics like payment volume, payout volume
   - Monitor revenue sharing calculations

3. **Audit Reports**
   - Generate regular reports for financial reconciliation
   - Track all financial adjustments

## Testing

1. **Unit Tests**
   - Test all calculation functions
   - Verify error handling

2. **Integration Tests**
   - Test Stripe API integration
   - Verify webhook handling

3. **End-to-End Tests**
   - Test complete payment flow
   - Test payout processing

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-26 | Payment Team | Initial documentation |
