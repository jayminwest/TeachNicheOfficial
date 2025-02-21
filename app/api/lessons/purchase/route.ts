import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe, calculateFees, stripeConfig } from '@/app/services/stripe'
import { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Record pending purchase
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: session.user.id,
        lesson_id: lessonId,
        creator_id: lesson.creator_id,
        stripe_session_id: checkoutSession.id,
        amount: lesson.price,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        fee_percentage: stripeConfig.platformFeePercent,
        status: 'pending',
        payment_intent_id: checkoutSession.payment_intent as string
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
