import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { stripeConfig } from '@/services/stripe';
import { calculateFees } from '@/lib/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  
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
    console.error('Purchase fetch error:', fetchError)
    return
  }

  // Calculate fees for creator earnings
  const { creatorEarnings } = calculateFees(purchase.amount)

  // Create transfer to creator
  try {
    const transfer = await stripe.transfers.create({
      amount: creatorEarnings,
      currency: stripeConfig.defaultCurrency,
      destination: purchase.lesson.creator.stripe_account_id,
      transfer_group: purchase.stripe_session_id,
      source_transaction: paymentIntent.id
    })

    // Update purchase status with transfer info
  const { error: updateError } = await supabase
    .from('purchases')
    .update({
      status: 'completed',
      purchase_date: new Date().toISOString(),
      metadata: {
        stripe_payment_status: paymentIntent.status,
        payment_completed_at: new Date().toISOString(),
        transfer_id: transfer.id,
        ...(typeof purchase.metadata === 'object' ? purchase.metadata : {})
      }
    })
    .eq('id', purchase.id)

  if (updateError) {
    console.error('Purchase update error:', updateError)
    return
  }

  console.log('Purchase completed:', purchase.id)
}

const handleAccountUpdated = async (account: Stripe.Account) => {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  
  // Update creator's profile with account status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_account_status: account.details_submitted ? 'verified' : 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id)

  if (updateError) {
    console.error('Profile update error:', updateError)
    return
  }

  console.log('Creator account status updated:', account.id)
}

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
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
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
