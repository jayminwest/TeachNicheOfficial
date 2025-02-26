import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { stripeConfig } from '@/app/services/stripe';
import { calculateFees } from '@/app/lib/utils';
import { calculateCreatorEarnings } from '@/app/services/earnings';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
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
      case 'payment_intent.succeeded':
        await handlePaymentIntent(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccount(event.data.object as Stripe.Account);
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

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Get purchase record by payment intent with lesson and creator details
  const { data: purchase, error: fetchError } = await supabase
    .from('purchases')
    .select(`
      *,
      lesson:lessons(
        creator:profiles!lessons_creator_id_fkey(
          stripe_account_id
        )
      )
    `)
    .eq('payment_intent_id', paymentIntent.id)
    .single()

  if (fetchError || !purchase) {
    console.error('Purchase fetch error:', fetchError);
    return;
  }

  // Calculate fees for creator earnings
  const { creatorEarnings } = calculateFees(purchase.amount)

  // Record the earnings in creator_earnings table
  try {
    await supabase
      .from('creator_earnings')
      .insert({
        creator_id: purchase.creator_id,
        payment_intent_id: paymentIntent.id,
        amount: creatorEarnings,
        lesson_id: purchase.lesson_id,
        status: 'pending'
      });
  } catch (error) {
    console.error('Failed to record creator earnings:', error);
    // Continue processing - this is not critical for the payment flow
  }

  // Update purchase status
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

    console.log('Purchase completed:', purchase.id);
  } catch (err) {
    console.error('Purchase update error:', err);
    return;
  }
}

async function handleAccount(account: Stripe.Account): Promise<void> {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Update creator's profile with account status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_account_status: account.details_submitted ? 'verified' : 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id)

  if (updateError) {
    console.error('Profile update error:', updateError);
    return;
  }

  console.log('Creator account status updated:', account.id);
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
    .select('id, creator_id, lesson_id')
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
    
    // Calculate refunded earnings amount
    const refundedEarnings = calculateCreatorEarnings(refundAmount);
    
    if (earnings.status === 'pending') {
      // If earnings are still pending, update the record
      await supabase
        .from('creator_earnings')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
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
          status: 'pending'
        });
    }
    
    console.log('Refund processed for purchase:', purchase.id);
  } catch (error) {
    console.error('Failed to handle earnings for refund:', error);
    // Continue processing - this is not critical for the refund flow
  }
}

