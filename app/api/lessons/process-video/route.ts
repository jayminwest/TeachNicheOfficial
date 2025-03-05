import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import Stripe from 'stripe';
import Mux from '@mux/mux-node';
import { muxClient } from '@/app/services/mux';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

// Initialize Mux client if not already initialized
const initMuxClient = () => {
  if (muxClient) return muxClient;
  
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  
  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables must be set');
  }
  
  return new Mux({
    tokenId,
    tokenSecret,
  });
};

// Wait for asset to be ready
async function waitForAssetReady(assetId: string, options: { maxAttempts?: number; interval?: number } = {}) {
  const { maxAttempts = 60, interval = 10000 } = options;
  
  // Handle temporary asset IDs
  if (assetId.startsWith('temp_')) {
    // For temporary assets, extract the upload ID
    const uploadId = assetId.substring(5);
    
    // Initialize Mux client
    const mux = initMuxClient();
    
    // Try to get the upload to check if it has an asset ID
    try {
      // Use the correct method to get upload status
      const upload = await mux.video.uploads.retrieve(uploadId);
      
      if (upload.asset_id) {
        // If the upload has an asset ID, use that instead
        assetId = upload.asset_id;
      } else {
        // If the upload doesn't have an asset ID yet, wait for it
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, interval));
          
          const updatedUpload = await mux.video.uploads.retrieve(uploadId);
          
          if (updatedUpload.asset_id) {
            assetId = updatedUpload.asset_id;
            break;
          }
          
          if (updatedUpload.status === 'error') {
            throw new Error(`Upload failed: ${updatedUpload.error?.message || 'Unknown error'}`);
          }
        }
        
        // If we still don't have an asset ID, throw an error
        if (assetId.startsWith('temp_')) {
          throw new Error('Timed out waiting for asset ID');
        }
      }
    } catch (error) {
      console.error('Error getting upload:', error);
      throw new Error('Failed to get upload status');
    }
  }
  
  // Now we should have a real asset ID
  const mux = initMuxClient();
  
  // Poll for asset status
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use the correct method to get asset status
      const asset = await mux.video.assets.retrieve(assetId);
      
      if (asset.status === 'ready') {
        // Get the playback ID
        const playbackIds = asset.playback_ids || [];
        const playbackId = playbackIds.length > 0 ? playbackIds[0].id : null;
        
        if (!playbackId) {
          throw new Error('Asset is ready but has no playback ID');
        }
        
        return {
          status: 'ready',
          playbackId,
          assetId
        };
      }
      
      if (asset.status === 'errored') {
        throw new Error('Asset processing failed');
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.error(`Error checking asset status (attempt ${attempt + 1}):`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Otherwise, wait and try again
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Timed out waiting for asset to be ready');
}

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
        // Update lesson with playback ID and change status to published
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
