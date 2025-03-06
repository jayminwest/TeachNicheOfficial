import { NextResponse } from 'next/server';
import { getStripe, stripeConfig } from '@/app/services/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/database';
import Stripe from 'stripe';

// Helper function for creating checkout sessions (not exported as a route handler)
async function createCheckoutSession(lessonId: string, price: number, baseUrl: string, creatorStripeAccountId: string) {
  if (!price || price <= 0) {
    throw new Error('Invalid price: must be a positive number');
  }

  const stripe = getStripe() as Stripe;
  
  // Calculate the application fee amount based on the platform fee percentage
  const applicationFeeAmount = Math.round(price * 100 * (stripeConfig.platformFeePercent / 100));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: stripeConfig.defaultCurrency,
          product_data: {
            name: 'Lesson Purchase',
          },
          unit_amount: price * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/lessons/${lessonId}?success=true`,
    cancel_url: `${baseUrl}/lessons/${lessonId}?canceled=true`,
    metadata: {
      lessonId,
    },
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: creatorStripeAccountId,
      },
    },
  });

  return session;
}

// App Router handler
export async function POST(request: Request) {
  try {
    const { lessonId, price, creatorId } = await request.json();
    
    // Get the base URL from the request
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Invalid price: must be a positive number' },
        { status: 400 }
      );
    }

    // Get the creator's Stripe account ID
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', creatorId)
      .single();

    if (profileError || !creatorProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Creator not found or not set up for payments' },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession(
      lessonId, 
      price, 
      baseUrl, 
      creatorProfile.stripe_account_id
    );
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
