# Issue Report: Purchase Flow Reliability and Database Tracking

## Description

The purchase flow is currently experiencing reliability issues that need to be addressed:

1. Stripe webhooks are returning 500 errors after purchases are completed
2. Purchase records are not being consistently added to the 'purchases' table in Supabase
3. There's no fallback mechanism when webhooks fail
4. The system doesn't properly track all purchase attempts

These issues result in users completing payments but not gaining access to purchased content, creating a poor user experience and potential revenue loss.

## Technical Analysis

The current implementation has several weaknesses:

1. **Webhook Handler Complexity**: The Stripe webhook handler contains overly complex logic with multiple nested try-catch blocks, making it difficult to debug and maintain.

2. **Inconsistent Purchase Record Creation**: Purchase records are created in multiple places (purchase API and webhook) without proper coordination.

3. **Insufficient Error Handling**: Many error cases are logged but not properly handled, leading to incomplete purchase flows.

4. **Missing Verification Fallbacks**: When webhooks fail, there's no alternative mechanism to verify purchases directly with Stripe.

5. **Incomplete Transaction Tracking**: The system doesn't properly track all stages of the purchase process.

## Affected Files

1. `app/api/webhooks/stripe/route.ts`
   - Webhook handler needs simplification and improved error handling
   - Better extraction of lesson and user IDs from session data

2. `app/services/database/purchasesService.ts`
   - Purchase creation method needs to handle existing purchases better
   - Additional checks needed to prevent duplicate records

3. `app/api/lessons/purchase/route.ts`
   - Improved error handling for purchase record creation
   - Better logging of purchase attempts

4. `app/api/lessons/check-purchase/route.ts`
   - Add direct Stripe verification as a fallback
   - Improve handling of pending purchases

## Steps to Reproduce

1. Log in as a user
2. Navigate to a lesson page
3. Click "Purchase Lesson" and complete the Stripe checkout
4. Return to the application
5. Observe that despite successful payment, the user doesn't have access to the lesson
6. Check server logs to see 500 errors from the webhook
7. Verify that no record exists in the 'purchases' table in Supabase

## Expected Behavior

1. **Reliable Purchase Tracking**:
   - Every purchase attempt should create a record in the database with 'pending' status
   - Successful payments should update the record to 'completed' status
   - Failed payments should update the record to 'failed' status

2. **Webhook Reliability**:
   - Webhook should process events without errors
   - If extraction of metadata fails, it should fall back to client_reference_id
   - Proper error handling should prevent 500 responses

3. **Fallback Mechanisms**:
   - If webhook fails, client-side verification should check purchase status directly with Stripe
   - The check-purchase endpoint should verify with Stripe if a pending purchase exists

4. **Consistent User Experience**:
   - Users should gain access to content immediately after successful payment
   - UI should reflect the correct purchase status

## Implementation Requirements

### 1. Webhook Handler Improvements

- Simplify the webhook handler logic
- Improve extraction of lesson and user IDs
- Add better error handling
- Implement a more robust purchase record update/creation process

```typescript
// Pseudocode for improved webhook handler
try {
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract IDs from metadata or client_reference_id
    const lessonId = extractLessonId(session);
    const userId = extractUserId(session);
    
    if (lessonId && userId) {
      // First try to update existing purchase
      const updateResult = await purchasesService.updatePurchaseStatus(
        session.id,
        'completed'
      );
      
      // If update fails, create new purchase
      if (updateResult.error) {
        await purchasesService.createPurchase({
          lessonId,
          userId,
          amount: session.amount_total / 100,
          stripeSessionId: session.id,
          fromWebhook: true
        });
      }
    }
  }
} catch (error) {
  // Handle error appropriately
}
```

### 2. Purchase Service Improvements

- Add checks for existing purchases by user and lesson
- Improve error handling and logging
- Add methods to verify purchase status directly with Stripe

```typescript
// Pseudocode for improved purchase creation
async createPurchase(data) {
  // Check if purchase with this session ID already exists
  const existingBySession = await checkExistingBySessionId(data.stripeSessionId);
  if (existingBySession) {
    return updateExistingPurchase(existingBySession);
  }
  
  // Check if user already has a purchase for this lesson
  const existingByUserAndLesson = await checkExistingByUserAndLesson(data.userId, data.lessonId);
  if (existingByUserAndLesson) {
    return updateExistingPurchase(existingByUserAndLesson, data);
  }
  
  // Create new purchase record
  return createNewPurchaseRecord(data);
}
```

### 3. Check Purchase Endpoint Improvements

- Add direct verification with Stripe as a fallback
- Improve handling of pending purchases
- Add better error reporting

```typescript
// Pseudocode for improved check purchase
async function checkPurchase(userId, lessonId, sessionId) {
  // First check database
  const dbAccess = await checkDatabaseAccess(userId, lessonId);
  if (dbAccess.hasAccess) return { hasAccess: true };
  
  // If sessionId provided, verify with Stripe
  if (sessionId) {
    const stripeVerification = await verifyWithStripe(sessionId);
    if (stripeVerification.isPaid) {
      await createOrUpdatePurchase(userId, lessonId, sessionId);
      return { hasAccess: true };
    }
  }
  
  // Check for pending purchases and verify with Stripe
  const pendingPurchase = await checkPendingPurchase(userId, lessonId);
  if (pendingPurchase) {
    const stripeVerification = await verifyWithStripe(pendingPurchase.sessionId);
    if (stripeVerification.isPaid) {
      await updatePurchaseStatus(pendingPurchase.id, 'completed');
      return { hasAccess: true };
    }
  }
  
  return { hasAccess: false };
}
```

## Testing Requirements

1. **Unit Tests**:
   - Test purchase creation with various scenarios (new purchase, existing session, existing user-lesson)
   - Test webhook handler with different event types and payload structures
   - Test purchase status verification with different Stripe responses

2. **Integration Tests**:
   - Test the complete purchase flow from checkout to access verification
   - Test fallback mechanisms when webhooks fail
   - Test handling of various error conditions

3. **Manual Testing**:
   - Complete actual purchases and verify database records
   - Simulate webhook failures and verify fallback mechanisms work
   - Test with different user accounts and lesson types

## Additional Context

This issue is critical for business operations as it directly impacts revenue and user experience. The solution should prioritize reliability and proper tracking of all purchase attempts, even in failure scenarios.

The implementation should follow these principles:
- Defensive programming with proper error handling
- Comprehensive logging for debugging
- Multiple fallback mechanisms
- Consistent database state

## Implementation Plan

1. First, simplify and improve the webhook handler
2. Then enhance the purchase service with better checks for existing purchases
3. Add fallback verification to the check-purchase endpoint
4. Improve error handling and logging throughout
5. Add comprehensive tests for all components

## Labels
- bug
- high-priority
- payment-system
