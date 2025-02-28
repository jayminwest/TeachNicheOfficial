import { NextResponse } from 'next/server'
import { stripe, stripeConfig } from '@/app/services/stripe'
import { calculateFees } from '@/app/lib/utils'
import { getAuth, User } from "firebase/auth"
import { getApp } from "firebase/app"

// Define the auth response type
interface AuthResponse {
  data: {
    session: { user: User } | null;
  };
  error: null | unknown;
}

export async function POST(request: Request) {
  try {
    const { data: { session } } = await new Promise<AuthResponse>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve({ data: { session: user ? { user } : null }, error: null });
      });
    });

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
    const { data: lesson, error: lessonError } = await firebaseClient
      .from('lessons')
      .select()
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
        userId: session.user.uid,
        creatorId: lesson.creator_id,
        version: '1'
      }
    })

    // Generate UUID for purchase record
    const purchaseId = crypto.randomUUID()

    // Record pending purchase
    const { error: purchaseError } = await firebaseClient
      .from('purchases')
      .insert({
        id: purchaseId,
        user_id: session.user.uid,
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
