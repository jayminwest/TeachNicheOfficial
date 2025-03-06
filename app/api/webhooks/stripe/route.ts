import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/purchasesService';

// Helper function to extract IDs from session
function extractIdsFromSession(session: Stripe.Checkout.Session) {
  // First try metadata
  let lessonId = session.metadata?.lessonId;
  let userId = session.metadata?.userId;
  const baseAmount = session.metadata?.baseAmount ? parseFloat(session.metadata.baseAmount) : undefined;
  
  // Then try client_reference_id
  if (!lessonId || !userId) {
    if (session.client_reference_id) {
      const refParts = session.client_reference_id.split('_');
      if (refParts.length >= 4 && refParts[0] === 'lesson' && refParts[2] === 'user') {
        lessonId = refParts[1];
        userId = refParts[3];
      }
    }
  }
  
  return { lessonId, userId, baseAmount };
}

// Function to get Stripe instance
const getStripe = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
  });
};

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

    if (!sig || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Verify the event came from Stripe
    let event: Stripe.Event;
    try {
      const stripe = getStripe();
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
        clientReferenceId: session.client_reference_id
      });
      
      // Extract IDs using the helper function
      const { lessonId, userId, baseAmount } = extractIdsFromSession(session);
      
      // If we don't have the necessary information, try to get it from expanded session
      if (!lessonId || !userId) {
        try {
          console.log('Missing IDs, retrieving expanded session');
          const stripe = getStripe();
          const expandedSession = await stripe.checkout.sessions.retrieve(
            session.id,
            { expand: ['line_items'] }
          );
          
          // Stripe instance already defined above
          // Try to extract from expanded session
          if (expandedSession.line_items?.data?.length > 0) {
            const description = expandedSession.line_items.data[0].description;
            if (description && description.startsWith('Access to lesson:')) {
              const title = description.replace('Access to lesson:', '').trim();
              
              // Try to find the lesson by title
              const supabase = await createServerSupabaseClient();
              const { data: lessons } = await supabase
                .from('lessons')
                .select('id, creator_id')
                .ilike('title', title)
                .limit(1);
              
              if (lessons && lessons.length > 0) {
                console.log(`Found lesson by title: ${lessons[0].id}`);
                // We have the lesson ID but still need user ID
                
                // Try to find the user from the customer email
                if (session.customer_details?.email) {
                  const { data: users } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', session.customer_details.email)
                    .limit(1);
                  
                  if (users && users.length > 0) {
                    console.log(`Found user by email: ${users[0].id}`);
                    // Now we have both IDs, proceed with purchase creation
                    const createResult = await purchasesService.createPurchase({
                      lessonId: lessons[0].id,
                      userId: users[0].id,
                      amount: session.amount_total ? session.amount_total / 100 : undefined,
                      stripeSessionId: session.id,
                      fromWebhook: true
                    });
                    
                    if (createResult.error) {
                      console.error('Failed to create purchase record:', createResult.error);
                      return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 });
                    }
                    
                    return NextResponse.json({ success: true, created: true });
                  }
                }
                
                // If we couldn't find the user, return partial success
                return NextResponse.json({ 
                  error: 'Partial information found, webhook will be retried',
                  lessonId: lessons[0].id
                }, { status: 202 });
              }
            }
          }
        } catch (expandError) {
          console.error('Error retrieving expanded session:', expandError);
        }
        
        console.error('Missing required information for purchase creation:', { sessionId: session.id });
        return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
      }
      
      console.log(`Processing purchase for lessonId=${lessonId}, userId=${userId}`);
      
      // First try to update existing purchase
      const updateResult = await purchasesService.updatePurchaseStatus(
        session.id,
        'completed'
      );
      
      // If update fails, create a new purchase record
      if (updateResult.error) {
        console.log('No existing purchase found, creating new purchase record');
        
        // Use the base amount from metadata if available, otherwise use the total amount
        const amount = baseAmount || (session.amount_total ? (session.amount_total / 100) : undefined);
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined;
        
        const createResult = await purchasesService.createPurchase({
          lessonId,
          userId,
          amount,
          stripeSessionId: session.id,
          paymentIntentId,
          fromWebhook: true
        });
        
        if (createResult.error) {
          console.error('Failed to create purchase record:', createResult.error);
          return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 });
        }
        
        console.log(`Created new purchase ${createResult.data?.id} from webhook data`);
        return NextResponse.json({ success: true, created: true });
      }
      
      console.log(`Updated purchase ${updateResult.data?.id} to completed`);
      return NextResponse.json({ success: true, updated: true });
    }
    
    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook handler:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
