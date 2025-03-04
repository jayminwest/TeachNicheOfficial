import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import Stripe from 'stripe';
import { purchasesService } from '@/app/services/database/purchasesService';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { lessonId, price } = body;

    if (!lessonId || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the user session
    const supabase = await createServerSupabaseClient();
    const { data: { session: userSession } } = await supabase.auth.getSession();

    if (!userSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userSession.user.id;

    // Fetch the lesson to verify it exists and get creator info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, title, price, creator_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Verify the price matches
    if (lesson.price !== price) {
      return NextResponse.json(
        { error: 'Price mismatch' },
        { status: 400 }
      );
    }

    // Don't allow creators to purchase their own lessons
    if (lesson.creator_id === userId) {
      return NextResponse.json(
        { error: 'You cannot purchase your own lesson' },
        { status: 400 }
      );
    }

    // Check if user already has access to this lesson
    const { data: accessData } = await purchasesService.checkLessonAccess(userId, lessonId);
    
    if (accessData?.hasAccess) {
      return NextResponse.json(
        { error: 'You already have access to this lesson' },
        { status: 400 }
      );
    }

    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lesson.title,
              description: `Access to lesson: ${lesson.title}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=success&session_id=${SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=canceled`,
      metadata: {
        lessonId,
        userId,
      },
      client_reference_id: `lesson_${lessonId}_user_${userId}`,
    });
    
    console.log('Created checkout session:', {
      id: checkoutSession.id,
      metadata: checkoutSession.metadata,
      client_reference_id: checkoutSession.client_reference_id
    });

    // Create a pending purchase record in the database
    await purchasesService.createPurchase({
      lessonId,
      userId,
      amount: price,
      stripeSessionId: checkoutSession.id,
    });

    // Return the session ID to the client
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
