import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import Stripe from 'stripe';
import { waitForAssetReady } from '@/app/services/mux';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});



export async function POST(request: Request) {
  try {
    const { lessonId, muxAssetId, isPaid } = await request.json();
    
    if (!lessonId || !muxAssetId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get the current user session - make sure to await cookies()
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the lesson to verify ownership
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      console.error('Error fetching lesson:', lessonError);
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Verify the user owns this lesson
    if (lesson.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this lesson' },
        { status: 403 }
      );
    }
    
    // For paid lessons, create Stripe product and price if they don't exist
    if (isPaid && (!lesson.stripe_product_id || !lesson.stripe_price_id)) {
      try {
        // Get the user's Stripe account ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile?.stripe_account_id) {
          return NextResponse.json(
            { error: 'Stripe account required for paid lessons' },
            { status: 400 }
          );
        }
        
        // Create a Stripe product
        const product = await stripe.products.create({
          name: lesson.title,
          description: lesson.description || undefined
        });
        
        // Create a Stripe price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round((lesson.price || 0) * 100),
          currency: 'usd'
        });
        
        // Update the lesson with Stripe IDs
        await supabase
          .from('lessons')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: price.id
          })
          .eq('id', lessonId);
      } catch (stripeError) {
        console.error('Error creating Stripe product/price:', stripeError);
        // Continue with video processing even if Stripe fails
      }
    }
    
    // Poll Mux API for asset status
    try {
      const result = await waitForAssetReady(muxAssetId, {
        maxAttempts: 60,
        interval: 10000
      });
      
      if (result.status === 'ready' && result.playbackId) {
        // Update lesson with playback ID and ensure status is published
        // Make sure we're using a valid status enum value
        const { error } = await supabase
          .from('lessons')
          .update({ 
            status: 'published',  // This is a valid enum value
            mux_playback_id: result.playbackId
          })
          .eq('id', lessonId);
        
        if (error) {
          console.error('Failed to update lesson:', error);
          return NextResponse.json(
            { error: 'Failed to update lesson', details: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true,
          playbackId: result.playbackId
        });
      } else {
        return NextResponse.json(
          { error: 'Video processing failed or timed out' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error processing video:', error);
      return NextResponse.json(
        { error: 'Failed to process video', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in process-video endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
