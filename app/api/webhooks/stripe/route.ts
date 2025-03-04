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
        paymentIntent: session.payment_intent,
        clientReferenceId: session.client_reference_id,
        amountTotal: session.amount_total
      });
      
      // Log the full session data for debugging
      console.log('Full session data:', JSON.stringify(session, null, 2));
      
      try {
        // Extract lesson ID and user ID from metadata or line items
        let lessonId = session.metadata?.lessonId;
        let userId = session.metadata?.userId;
        
        // If metadata is missing, try to extract from client_reference_id
        if (!lessonId || !userId) {
          if (session.client_reference_id) {
            const refParts = session.client_reference_id.split('_');
            if (refParts.length >= 4 && refParts[0] === 'lesson' && refParts[2] === 'user') {
              lessonId = refParts[1];
              userId = refParts[3];
              console.log(`Extracted from client_reference_id: lessonId=${lessonId}, userId=${userId}`);
            }
          }
        }
        
        // If we still don't have the IDs, try to extract from line items description
        if ((!lessonId || !userId) && session.line_items?.data?.length > 0) {
          const description = session.line_items.data[0].description;
          if (description && description.startsWith('Access to lesson:')) {
            // Try to find the lesson by title
            const title = description.replace('Access to lesson:', '').trim();
            console.log(`Trying to find lesson by title: "${title}"`);
            
            // We'll need to query the database here
            const supabase = await createServerSupabaseClient();
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id, creator_id')
              .ilike('title', title)
              .limit(1);
              
            if (lessons && lessons.length > 0) {
              lessonId = lessons[0].id;
              console.log(`Found lesson by title: ${lessonId}`);
            }
          }
        }
        
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
          
          // If we have the lesson ID and user ID, create a purchase record
          if (lessonId && userId) {
            console.log(`Creating purchase from webhook with lessonId=${lessonId}, userId=${userId}`);
            console.log('Attempting to create purchase record from webhook data');
            
            try {
              const createResult = await purchasesService.createPurchase({
                lessonId,
                userId,
                amount: (session.amount_total || 0) / 100, // Convert from cents
                stripeSessionId: session.id,
                paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
                fromWebhook: true
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
          } else {
            console.error('Cannot create purchase record: missing lessonId or userId');
            return NextResponse.json({ 
              error: 'Failed to update purchase status and cannot create new record due to missing data',
              lessonId,
              userId
            }, { status: 500 });
          }
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
