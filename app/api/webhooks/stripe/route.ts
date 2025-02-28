import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeConfig } from '@/app/services/stripe';
import { FirestoreDatabase } from '@/app/services/database/firebase-database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: stripeConfig.apiVersion
});

// Create database service
const db = new FirestoreDatabase();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntent(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      // Add more event types as needed
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  // Only process completed payments
  if (session.payment_status !== 'paid') {
    return;
  }
  
  // Extract metadata
  const metadata = session.metadata || {};
  const purchaseId = metadata.purchaseId;
  const lessonId = metadata.lessonId;
  const creatorId = metadata.creatorId;
  const userId = metadata.userId;
  
  if (!purchaseId || !lessonId || !creatorId || !userId) {
    console.error('Missing required metadata in checkout session:', session.id);
    return;
  }
  
  // Update purchase status
  try {
    // Get the purchase document
    const purchaseSnapshot = await db.query('purchases', [
      { field: 'id', operator: '==', value: purchaseId }
    ]);
    
    if (!purchaseSnapshot || !purchaseSnapshot.rows || purchaseSnapshot.rows.length === 0) {
      console.error('Purchase not found:', purchaseId);
      return;
    }
    
    // Update the purchase
    await db.update('purchases', purchaseId, {
      status: 'completed',
      purchase_date: new Date().toISOString(),
      metadata: {
        stripe_payment_status: session.payment_status,
        payment_completed_at: new Date().toISOString(),
        checkout_session_id: session.id,
      }
    });

    console.log('Purchase completed via checkout session:', purchaseId);
  } catch (err) {
    console.error('Purchase update error:', err);
    return;
  }
}

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  // Get purchase record by payment intent
  const purchaseSnapshot = await db.query('purchases', [
    { field: 'payment_intent_id', operator: '==', value: paymentIntent.id }
  ]);
  
  if (!purchaseSnapshot || !purchaseSnapshot.rows || purchaseSnapshot.rows.length === 0) {
    console.error('Purchase not found for payment intent:', paymentIntent.id);
    return;
  }
  
  // Define the purchase type
  interface Purchase {
    id: string;
    creator_id: string;
    lesson_id: string;
    creator_earnings: number;
    amount: number;
    status: string;
    metadata?: Record<string, unknown>;
  }
  
  const purchase = purchaseSnapshot.rows[0] as Purchase;

  // Record the earnings in creator_earnings table
  try {
    await db.create('creator_earnings', {
      creator_id: purchase.creator_id,
      payment_intent_id: paymentIntent.id,
      amount: purchase.creator_earnings,
      lesson_id: purchase.lesson_id,
      purchase_id: purchase.id,
      status: 'pending',
      created_at: new Date().toISOString()
    });
      
    console.log('Creator earnings recorded:', purchase.creator_id, purchase.creator_earnings);
  } catch (error) {
    console.error('Failed to record creator earnings:', error);
    // Continue processing - this is not critical for the payment flow
  }

  // Update purchase status if not already completed
  if (purchase.status !== 'completed') {
    try {
      await db.update('purchases', purchase.id, {
        status: 'completed',
        purchase_date: new Date().toISOString(),
        metadata: {
          stripe_payment_status: paymentIntent.status,
          payment_completed_at: new Date().toISOString(),
          ...(typeof purchase.metadata === 'object' ? purchase.metadata : {} as Record<string, unknown>)
        }
      });

      console.log('Purchase completed via payment intent:', purchase.id);
    } catch (err) {
      console.error('Purchase update error:', err);
      return;
    }
  }
}

async function handleRefund(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = charge.payment_intent as string;
  const refundAmount = charge.amount_refunded;
  
  if (!paymentIntentId) {
    console.error('Missing payment intent ID in refund:', charge.id);
    return;
  }
  
  // Get the purchase record
  const purchaseSnapshot = await db.query('purchases', [
    { field: 'payment_intent_id', operator: '==', value: paymentIntentId }
  ]);
  
  if (!purchaseSnapshot || !purchaseSnapshot.rows || purchaseSnapshot.rows.length === 0) {
    console.error('Purchase not found for refund:', paymentIntentId);
    return;
  }
  
  const purchase = purchaseSnapshot.rows[0];
  
  // Update purchase status
  try {
    // Type assertion for purchase since we know the structure
    interface Purchase {
      id: string;
      amount: number;
      creator_id: string;
      lesson_id: string;
      status: string;
      metadata?: Record<string, unknown>;
    }
    
    const typedPurchase = purchase as Purchase;
    
    await db.update('purchases', typedPurchase.id, {
      status: 'refunded',
      updated_at: new Date().toISOString(),
      metadata: {
        refunded_at: new Date().toISOString(),
        refund_amount: refundAmount,
        refund_id: charge.refunds?.data[0]?.id,
      }
    });
  } catch (updateError) {
    console.error('Purchase update error for refund:', updateError);
    return;
  }
  
  // Handle the earnings adjustment
  try {
    // Get the earnings record
    const earningsSnapshot = await db.query('creator_earnings', [
      { field: 'payment_intent_id', operator: '==', value: paymentIntentId }
    ]);
    
    if (!earningsSnapshot || !earningsSnapshot.rows || earningsSnapshot.rows.length === 0) {
      console.error('Earnings not found for refund:', paymentIntentId);
      return;
    }
    
    // Define the earnings type
    interface Earnings {
      id: string;
      amount: number;
      status: string;
    }
    
    const earnings = earningsSnapshot.rows[0] as Earnings;
    
    // Type assertion for purchase since we know the structure
    interface Purchase {
      id: string;
      amount: number;
      creator_id: string;
      lesson_id: string;
      status: string;
      metadata?: Record<string, any>;
    }
    
    const typedPurchase = purchase as Purchase;
    
    // Calculate refunded earnings amount (proportional to refund amount)
    const refundRatio = refundAmount / typedPurchase.amount;
    const refundedEarnings = Math.round(earnings.amount * refundRatio);
    
    if (earnings.status === 'pending') {
      // If earnings are still pending, update the record
      await db.update('creator_earnings', earnings.id, {
        status: 'failed',
        updated_at: new Date().toISOString(),
        metadata: {
          refunded_at: new Date().toISOString(),
          refund_amount: refundedEarnings,
          refund_id: charge.refunds?.data[0]?.id,
        }
      });
    } else if (earnings.status === 'paid') {
      // If earnings were already paid, create a negative adjustment
      await db.create('creator_earnings', {
        creator_id: typedPurchase.creator_id,
        payment_intent_id: `${paymentIntentId}_refund`,
        amount: -refundedEarnings, // Negative amount
        lesson_id: typedPurchase.lesson_id,
        purchase_id: typedPurchase.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          refund_for: earnings.id,
          refund_id: charge.refunds?.data[0]?.id,
          original_payment_intent_id: paymentIntentId,
        }
      });
    }
    
    console.log('Refund processed for purchase:', typedPurchase.id);
  } catch (error) {
    console.error('Failed to handle earnings for refund:', error);
    // Continue processing - this is not critical for the refund flow
  }
}

