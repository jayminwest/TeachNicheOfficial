import { NextRequest, NextResponse } from 'next/server';
import { stripeConfig } from '@/app/services/stripe';
import { calculateFees } from '@/app/lib/constants';
import Stripe from 'stripe';
import { z } from 'zod';
import { getAuth, User } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { firebaseClient } from '@/app/services/firebase-compat';

// Define a type for the query builder that matches the firebase-compat implementation
type QueryBuilder = {
  eq: (field: string, value: string | boolean | number) => QueryBuilder;
  order: (field: string, options: { ascending: boolean }) => QueryBuilder;
  orderBy: (field: string, direction?: string) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  get: () => Promise<{ 
    data: Array<Record<string, unknown>>; 
    error: Error | null | unknown 
  }>;
  execute: () => Promise<{ 
    data: Array<Record<string, unknown>>; 
    error: Error | null | unknown 
  }>;
};

// Initialize Stripe
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-01-27.acacia',
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
    // Get the current user using the route handler client
    const user = await new Promise<User | null>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });
    
    if (!user) {
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
      userId = user.uid,
      utm_source,
      utm_medium,
      utm_campaign,
      referral
    } = result.data;
    
    // Verify the user is making a purchase for themselves
    if (user.uid !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to make this purchase' },
        { status: 403 }
      );
    }
    
    // Check if user already owns this lesson
    let queryBuilder = firebaseClient
      .from('purchases')
      .select() as unknown as QueryBuilder;
      
    // Apply filters
    queryBuilder = queryBuilder.eq('user_id', userId);
    queryBuilder = queryBuilder.eq('lesson_id', lessonId);
    queryBuilder = queryBuilder.eq('status', 'completed');
    
    // Execute the query
    const { data: existingPurchase } = await queryBuilder.get();
      
    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this lesson' },
        { status: 403 }
      );
    }
    
    // Get lesson details
    let lessonQueryBuilder = firebaseClient
      .from('lessons')
      .select() as unknown as QueryBuilder;
      
    // Apply filter
    lessonQueryBuilder = lessonQueryBuilder.eq('id', lessonId);
    
    // Execute the query
    const { data: lessons, error: lessonError } = await lessonQueryBuilder.get();
      
    const lesson = lessons && lessons.length > 0 ? lessons[0] : null;
      
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Verify the price matches the lesson's actual price
    // We already have the lesson from the previous query
    const lessonPrice = lesson.price;
      
    if (lessonPrice === undefined || lessonPrice === null) {
      return NextResponse.json(
        { error: 'Failed to verify lesson price' },
        { status: 500 }
      );
    }
    
    // Calculate expected total price with fees
    const { totalBuyerCost: expectedPrice } = calculateFees(Number(lessonPrice));
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
    const purchaseData = {
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
    };
    
    const { data: purchase, error: purchaseError } = await firebaseClient
      .from('purchases')
      .insert(purchaseData);
      
    if (purchaseError || !purchase) {
      console.error('Purchase creation error:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }
    
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
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
    await firebaseClient
      .from('purchases')
      .update({
        stripe_session_id: checkoutSession.id,
        payment_intent_id: checkoutSession.payment_intent as string,
      }, { eq: ['id', purchase.id] });
    
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
