import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/purchasesService';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// This is your Stripe webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // Update the purchase status in the database
      const { data, error } = await purchasesService.updatePurchaseStatus(
        session.id,
        'completed'
      );

      if (error) {
        console.error('Error updating purchase status:', error);
        return NextResponse.json({ error: 'Failed to update purchase status' }, { status: 500 });
      }

      console.log(`Purchase ${data?.id} marked as completed`);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Error processing webhook:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
