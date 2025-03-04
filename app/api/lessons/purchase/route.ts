import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe, stripeConfig } from '@/app/services/stripe'
import { calculateFees } from '@/app/lib/utils'
import { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      )
    }

    const { lessonId } = await request.json()

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    // Get lesson and creator details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        creator:profiles!lessons_creator_id_fkey (
          id,
          stripe_account_id
        )
      `)
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      console.error('Lesson fetch error:', lessonError)
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if creator has Stripe account
    if (!lesson.creator.stripe_account_id) {
      return NextResponse.json(
        { error: 'Creator payment setup incomplete' },
        { status: 400 }
      )
    }

    // Calculate fees
    const { platformFee, creatorEarnings } = calculateFees(lesson.price)

    // Verify Stripe client is initialized
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: stripeConfig.defaultCurrency,
          product_data: {
            name: lesson.title,
            description: lesson.description || undefined,
            images: lesson.thumbnail_url ? [lesson.thumbnail_url] : undefined,
          },
          unit_amount: Math.round(lesson.price * 100), // Convert dollars to cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=cancelled`,
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session',
        },
      },
      metadata: {
        lessonId,
        userId: session.user.id,
        creatorId: lesson.creator_id,
        version: '1'
      }
    })

    // Generate UUID for purchase record
    const purchaseId = crypto.randomUUID()

    // Record pending purchase
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        id: purchaseId,
        user_id: session.user.id,
        lesson_id: lessonId,
        creator_id: lesson.creator_id,
        stripe_session_id: checkoutSession.id,
        amount: lesson.price,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        fee_percentage: stripeConfig.platformFeePercent,
        status: 'pending',
        payment_intent_id: checkoutSession.id, // Use session ID instead of payment intent
        metadata: {
          version: '1'
        }
      })

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError)
      return NextResponse.json(
        { error: 'Failed to record purchase' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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
    const session = await stripe.checkout.sessions.create({
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/lessons/${lessonId}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/lessons/${lessonId}?purchase=canceled`,
      metadata: {
        lessonId,
        userId,
      },
    });

    // Create a pending purchase record in the database
    await purchasesService.createPurchase({
      lessonId,
      userId,
      amount: price,
      stripeSessionId: session.id,
    });

    // Return the session ID to the client
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
