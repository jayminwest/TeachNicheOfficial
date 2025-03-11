import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import Mux from '@mux/mux-node';
import Stripe from 'stripe';

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

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
    
    // Get the current user session
    const supabase = await createServerSupabaseClient();
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
    
    // Get asset details from Mux
    try {
      const asset = await Video.Assets.get(muxAssetId);
      const playbackId = asset.playback_ids?.[0]?.id;
      
      if (asset.status === 'ready' && playbackId) {
        // Update lesson with playback ID and ensure status is published
        const { error } = await supabase
          .from('lessons')
          .update({ 
            status: 'published',
            mux_playback_id: playbackId,
            video_processing_status: 'ready'
          })
          .eq('id', lessonId);
        
        if (error) {
          console.error('Failed to update lesson:', error);
          return NextResponse.json(
            { error: 'Failed to update lesson', details: error.message },
            { status: 500 }
          );
        }
        
        // For paid content, update the playback policy to be signed
        if (isPaid) {
          await Video.Assets.updatePlaybackRestriction(muxAssetId, {
            playback_restriction_policy: {
              type: 'jwt',
              signing_key_id: process.env.MUX_SIGNING_KEY_ID,
            },
          });
        }
        
        return NextResponse.json({ 
          success: true,
          playbackId: playbackId
        });
      } else {
        // Asset is still processing, update status
        await supabase
          .from('lessons')
          .update({ 
            video_processing_status: asset.status
          })
          .eq('id', lessonId);
          
        return NextResponse.json({ 
          success: false,
          status: asset.status,
          message: 'Video is still processing'
        });
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
