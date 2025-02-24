import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with a fallback for tests
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia'
    });
  }
} catch (error) {
  console.error('Stripe initialization error:', error);
  // In tests, we'll use mocks
}

// Helper function for creating checkout sessions (not exported as a route handler)
async function createCheckoutSession(lessonId: string, price: number, baseUrl: string) {
  if (!price || price <= 0) {
    throw new Error('Invalid price: must be a positive number');
  }

  if (!stripe) {
    throw new Error('Stripe is not properly initialized');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
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
  });

  return session;
}

// App Router handler
export async function POST(request: Request) {
  try {
    const { lessonId, price } = await request.json();
    
    // Get the base URL from the request
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Invalid price: must be a positive number' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly initialized' },
        { status: 500 }
      );
    }

    const session = await createCheckoutSession(lessonId, price, baseUrl);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
