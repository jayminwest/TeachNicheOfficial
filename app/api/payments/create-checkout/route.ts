import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase/auth';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { stripeConfig } from '@/app/services/stripe';
import { calculateFees } from '@/app/lib/constants';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion,
});

// Validate the request body
const checkoutSchema = z.object({
  lessonId: z.string().uuid(),
  price: z.number().positive(),
  userId: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referral: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await firebaseAuth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = checkoutSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      lessonId, 
      price, 
      userId = user.id,
      utm_source,
      utm_medium,
      utm_campaign,
      referral
    } = result.data;
    
    // Verify the user is making a purchase for themselves
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to make this purchase' },
        { status: 403 }
      );
    }
    
    // Check if user already owns this lesson
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .eq('status', 'completed')
      .maybeSingle();
      
    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this lesson' },
        { status: 403 }
      );
    }
    
    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('creator_id, title, description')
      .eq('id', lessonId)
      .single();
      
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Verify the price matches the lesson's actual price
    const { data: lessonPrice } = await supabase
      .from('lessons')
      .select('price')
      .eq('id', lessonId)
      .single();
      
    if (!lessonPrice) {
      return NextResponse.json(
        { error: 'Failed to verify lesson price' },
        { status: 500 }
      );
    }
    
    // Calculate expected total price with fees
    const { totalBuyerCost: expectedPrice } = calculateFees(lessonPrice.price);
    const expectedPriceInCents = Math.round(expectedPrice * 100);
    
    // Validate the price (allow small rounding differences)
    if (Math.abs(price - expectedPriceInCents) > 1) {
      console.error(`Price mismatch: received ${price}, expected ${expectedPriceInCents}`);
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }
    
    // Calculate fees
    const priceInCents = Math.round(price * 100); // Convert to cents
    const platformFee = Math.round(priceInCents * (stripeConfig.platformFeePercent / 100));
    const creatorEarnings = priceInCents - platformFee;
    
    // Create a purchase record
    const purchaseId = crypto.randomUUID();
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        id: purchaseId,
        user_id: userId,
        lesson_id: lessonId,
        creator_id: lesson.creator_id,
        amount: priceInCents,
        status: 'pending',
        fee_percentage: stripeConfig.platformFeePercent,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        stripe_session_id: 'pending', // Will be updated after Stripe session creation
        payment_intent_id: 'pending', // Will be updated after Stripe session creation
        metadata: {
          utm_source,
          utm_medium,
          utm_campaign,
          referral,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();
      
    if (purchaseError || !purchase) {
      console.error('Purchase creation error:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }
    
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: stripeConfig.defaultCurrency,
            product_data: {
              name: lesson.title,
              description: lesson.description?.substring(0, 255) || `Access to ${lesson.title}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/lessons/${lessonId}`,
      metadata: {
        lessonId,
        userId,
        purchaseId: purchase.id,
        creatorId: lesson.creator_id,
      },
      customer_email: user.email,
    });
    
    // Update purchase record with session ID
    await supabase
      .from('purchases')
      .update({
        stripe_session_id: checkoutSession.id,
        payment_intent_id: checkoutSession.payment_intent as string,
      })
      .eq('id', purchase.id);
    
    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to create checkout session' 
      },
      { status: 500 }
    );
  }
}
