import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { stripeConfig } from '@/app/services/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: stripeConfig.apiVersion
});

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
  
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Extract metadata
  const { purchaseId, lessonId, creatorId, userId } = session.metadata || {};
  
  if (!purchaseId || !lessonId || !creatorId || !userId) {
    console.error('Missing required metadata in checkout session:', session.id);
    return;
  }
  
  // Update purchase status
  try {
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        purchase_date: new Date().toISOString(),
        metadata: {
          stripe_payment_status: session.payment_status,
          payment_completed_at: new Date().toISOString(),
          checkout_session_id: session.id,
        }
      })
      .eq('id', purchaseId);

    if (updateError) {
      console.error('Purchase update error:', updateError);
      return;
    }

    console.log('Purchase completed via checkout session:', purchaseId);
  } catch (err) {
    console.error('Purchase update error:', err);
    return;
  }
}

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Get purchase record by payment intent
  const { data: purchase, error: fetchError } = await supabase
    .from('purchases')
    .select('*')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (fetchError || !purchase) {
    console.error('Purchase fetch error:', fetchError);
    return;
  }

  // Record the earnings in creator_earnings table
  try {
    await supabase
      .from('creator_earnings')
      .insert({
        creator_id: purchase.creator_id,
        payment_intent_id: paymentIntent.id,
        amount: purchase.creator_earnings,
        lesson_id: purchase.lesson_id,
        purchase_id: purchase.id,
        status: 'pending'
      });
      
    console.log('Creator earnings recorded:', purchase.creator_id, purchase.creator_earnings);
  } catch (error) {
    console.error('Failed to record creator earnings:', error);
    // Continue processing - this is not critical for the payment flow
  }

  // Update purchase status if not already completed
  if (purchase.status !== 'completed') {
    try {
      const { error: updateError } = await supabase
        .from('purchases')
        .update({
          status: 'completed',
          purchase_date: new Date().toISOString(),
          metadata: {
            stripe_payment_status: paymentIntent.status,
            payment_completed_at: new Date().toISOString(),
            ...(typeof purchase.metadata === 'object' ? purchase.metadata : {})
          }
        })
        .eq('id', purchase.id);

      if (updateError) {
        console.error('Purchase update error:', updateError);
        return;
      }

      console.log('Purchase completed via payment intent:', purchase.id);
    } catch (err) {
      console.error('Purchase update error:', err);
      return;
    }
  }
}

async function handleRefund(charge: Stripe.Charge): Promise<void> {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const paymentIntentId = charge.payment_intent as string;
  const refundAmount = charge.amount_refunded;
  
  if (!paymentIntentId) {
    console.error('Missing payment intent ID in refund:', charge.id);
    return;
  }
  
  // Get the purchase record
  const { data: purchase, error: fetchError } = await supabase
    .from('purchases')
    .select('id, creator_id, lesson_id, amount')
    .eq('payment_intent_id', paymentIntentId)
    .single();
    
  if (fetchError || !purchase) {
    console.error('Purchase fetch error for refund:', fetchError);
    return;
  }
  
  // Update purchase status
  const { error: updateError } = await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
      metadata: {
        refunded_at: new Date().toISOString(),
        refund_amount: refundAmount,
        refund_id: charge.refunds?.data[0]?.id,
      }
    })
    .eq('id', purchase.id);
    
  if (updateError) {
    console.error('Purchase update error for refund:', updateError);
    return;
  }
  
  // Handle the earnings adjustment
  try {
    // Get the earnings record
    const { data: earnings, error: earningsError } = await supabase
      .from('creator_earnings')
      .select('id, amount, status')
      .eq('payment_intent_id', paymentIntentId)
      .single();
      
    if (earningsError || !earnings) {
      console.error('Earnings fetch error for refund:', earningsError);
      return;
    }
    
    // Calculate refunded earnings amount (proportional to refund amount)
    const refundRatio = refundAmount / purchase.amount;
    const refundedEarnings = Math.round(earnings.amount * refundRatio);
    
    if (earnings.status === 'pending') {
      // If earnings are still pending, update the record
      await supabase
        .from('creator_earnings')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          metadata: {
            refunded_at: new Date().toISOString(),
            refund_amount: refundedEarnings,
            refund_id: charge.refunds?.data[0]?.id,
          }
        })
        .eq('id', earnings.id);
    } else if (earnings.status === 'paid') {
      // If earnings were already paid, create a negative adjustment
      await supabase
        .from('creator_earnings')
        .insert({
          creator_id: purchase.creator_id,
          payment_intent_id: `${paymentIntentId}_refund`,
          amount: -refundedEarnings, // Negative amount
          lesson_id: purchase.lesson_id,
          purchase_id: purchase.id,
          status: 'pending',
          metadata: {
            refund_for: earnings.id,
            refund_id: charge.refunds?.data[0]?.id,
            original_payment_intent_id: paymentIntentId,
          }
        });
    }
    
    console.log('Refund processed for purchase:', purchase.id);
  } catch (error) {
    console.error('Failed to handle earnings for refund:', error);
    // Continue processing - this is not critical for the refund flow
  }
}

