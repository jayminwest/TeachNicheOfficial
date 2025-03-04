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
        metadata: session.metadata,
        paymentIntent: session.payment_intent
      });
      
      try {
        // Try to update using the session ID first
        let updateResult = await purchasesService.updatePurchaseStatus(
          session.id,
          'completed'
        );
        
        // If that fails and we have a payment_intent, try using that
        if (updateResult.error && session.payment_intent) {
          console.log(`Retrying with payment_intent: ${session.payment_intent}`);
          
          // If payment_intent is a string, use it directly
          if (typeof session.payment_intent === 'string') {
            updateResult = await purchasesService.updatePurchaseStatus(
              session.payment_intent,
              'completed'
            );
          }
        }
        
        // Check the final result
        if (updateResult.error) {
          console.error('Error updating purchase status:', updateResult.error);
          
          // Instead of failing, let's create a purchase record if one doesn't exist
          if (session.metadata?.lessonId && session.metadata?.userId) {
            console.log('Attempting to create purchase record from webhook data');
            
            try {
              const createResult = await purchasesService.createPurchase({
                lessonId: session.metadata.lessonId,
                userId: session.metadata.userId,
                amount: (session.amount_total || 0) / 100, // Convert from cents
                stripeSessionId: session.id,
              });
              
              if (createResult.error) {
                console.error('Failed to create purchase record:', createResult.error);
                return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 });
              }
              
              console.log(`Created new purchase ${createResult.data?.id} from webhook data`);
              return NextResponse.json({ success: true, created: true });
            } catch (createErr) {
              console.error('Error creating purchase:', createErr);
              return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
            }
          }
          
          return NextResponse.json({ error: 'Failed to update purchase status' }, { status: 500 });
        }

        console.log(`Purchase ${updateResult.data?.id} marked as completed`);
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error('Error processing webhook:', err instanceof Error ? err.message : 'Unknown error', err);
        
        // Log the full session data for debugging
        console.log('Full session data:', JSON.stringify(session, null, 2));
        
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
