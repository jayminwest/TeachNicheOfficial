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
  try {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');

    console.log('Received Stripe webhook', { 
      hasSignature: !!sig,
      hasSecret: !!endpointSecret,
      payloadLength: payload.length
    });

    let event: Stripe.Event;

    try {
      if (!sig || !endpointSecret) {
        console.error('Missing signature or endpoint secret');
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
      }

      // Verify the event came from Stripe
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      console.log('Webhook verified, event type:', event.type);
    } catch (err) {
      console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout.session.completed', { 
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata
      });
      
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
        console.error('Error processing webhook:', err instanceof Error ? err.message : 'Unknown error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    } else {
      console.log('Unhandled event type:', event.type);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error instanceof Error ? error.message : 'Unknown error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
