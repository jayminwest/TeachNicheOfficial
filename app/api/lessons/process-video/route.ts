import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

export async function POST(request: Request) {
  try {
    const { lessonId, muxAssetId, isPaid } = await request.json();
    
    if (!lessonId || !muxAssetId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Get the current user session
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the lesson to verify ownership
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    
    // Verify the user owns this lesson
    if (lesson.creator_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - you do not own this lesson' }, { status: 403 });
    }
    
    // For paid lessons, create Stripe product and price
    if (isPaid && (!lesson.stripe_product_id || !lesson.stripe_price_id)) {
      try {
        // Get the user's Stripe account ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile?.stripe_account_id) {
          return NextResponse.json({ error: 'Stripe account required for paid lessons' }, { status: 400 });
        }
        
        // Create a Stripe product and price
        const product = await stripe.products.create({
          name: lesson.title,
          description: lesson.description || undefined
        });
        
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
      }
    }
    
    try {
      // Import Mux SDK
      const Mux = await import('@mux/mux-node');
      
      // Initialize the Video client
      const videoClient = new Mux.default({
        tokenId: process.env.MUX_TOKEN_ID!,
        tokenSecret: process.env.MUX_TOKEN_SECRET!,
      }).video;
      
      const asset = await videoClient.assets.retrieve(muxAssetId);
      const playbackId = asset.playback_ids?.[0]?.id;
      
      if (asset.status === 'ready' && playbackId) {
        // Update lesson with playback ID and ensure status is published
        await supabase
          .from('lessons')
          .update({ 
            status: 'published',
            mux_playback_id: playbackId,
            video_processing_status: 'ready'
          })
          .eq('id', lessonId);
        
        // For paid content, update the playback policy to be signed
        if (isPaid && process.env.MUX_SIGNING_KEY_ID) {
          await videoClient.playbackRestrictions.create({
            referrer: {
              type: 'jwt',
              signing_key_id: process.env.MUX_SIGNING_KEY_ID
            },
            assets: [muxAssetId]
          });
        }
        
        return NextResponse.json({ success: true, playbackId });
      } else {
        // Asset is still processing, update status
        await supabase
          .from('lessons')
          .update({ video_processing_status: asset.status })
          .eq('id', lessonId);
          
        return NextResponse.json({ 
          success: false,
          status: asset.status,
          message: 'Video is still processing'
        });
      }
    } catch (error) {
      console.error('Error processing video:', error);
      return NextResponse.json({ error: 'Failed to process video' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in process-video endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
