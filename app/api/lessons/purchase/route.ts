import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe, calculateFees, stripeConfig } from '@/app/services/stripe'
import { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Create supabase client with explicit cookie handling
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore
    })

    // Get session with error handling
    let session;
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!data.session?.user) {
        throw new Error('No authenticated user')
      }
      session = data.session
    } catch (error) {
      console.error('Session fetch error:', error)
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      )
    }

    const user = session.user

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
          unit_amount: lesson.price,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=cancelled`,
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: lesson.creator.stripe_account_id,
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
        payment_intent_id: checkoutSession.payment_intent as string,
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
