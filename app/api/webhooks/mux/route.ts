import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/types/database';

export async function POST(request: Request) {
  // Clone the request to read the body twice (once for verification, once for processing)
  const clonedRequest = request.clone();
  
  // Verify webhook signature if MUX_WEBHOOK_SECRET is set
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
  if (webhookSecret) {
    try {
      const signature = request.headers.get('mux-signature');
      
      // Get the raw request body as text for signature verification
      const rawBody = await clonedRequest.text();
      
      // Import the verification function
      const { verifyMuxWebhookSignature } = await import('@/app/lib/mux-webhook');
      
      // Verify the signature
      const isValid = verifyMuxWebhookSignature(signature, rawBody, webhookSecret);
      
      if (!isValid) {
        // Continue without verification in development
        if (process.env.NODE_ENV !== 'development') {
          console.error('Invalid Mux webhook signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        } else {
          console.warn('Invalid Mux webhook signature, but continuing in development mode');
        }
      } else {
        console.log('Mux webhook signature verified successfully');
      }
    } catch (verificationError) {
      console.error('Error verifying webhook signature:', verificationError);
      // Continue without verification in development
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ 
          error: 'Signature verification failed',
          details: verificationError instanceof Error ? verificationError.message : String(verificationError)
        }, { status: 401 });
      }
    }
  } else {
    console.warn('MUX_WEBHOOK_SECRET not set, skipping webhook signature verification');
  }
  try {
    // Get the request body
    const body = await request.json();
    const type = body.type;
    
    console.log(`Received Mux webhook: ${type}`, JSON.stringify(body, null, 2));
    
    // Create Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() });
    
    // Handle video.upload.asset_created event
    if (type === 'video.upload.asset_created') {
      const uploadId = body.data.upload_id;
      const assetId = body.data.asset_id;
      
      console.log(`Upload ${uploadId} created asset ${assetId}`);
      
      // Update the lesson with the asset ID
      const { data, error } = await supabase
        .from('lessons')
        .update({ 
          mux_asset_id: assetId,
          video_processing_status: 'processing'
        })
        .eq('mux_upload_id', uploadId)
        .select('id, title');
      
      if (error) {
        console.error('Error updating lesson with asset ID:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
      
      if (data && data.length > 0) {
        console.log(`Updated lesson "${data[0].title}" (${data[0].id}) with asset ID ${assetId}`);
      } else {
        console.warn(`No lesson found with upload ID ${uploadId}`);
      }
    }
    
    // Handle video.asset.ready event
    if (type === 'video.asset.ready') {
      const assetId = body.data.id;
      const playbackId = body.data.playback_ids?.[0]?.id;
      
      if (!playbackId) {
        console.error('No playback ID found in asset.ready event');
        return NextResponse.json({ error: 'No playback ID found' }, { status: 400 });
      }
      
      console.log(`Asset ${assetId} is ready with playback ID ${playbackId}`);
      
      // Update the lesson with the playback ID and set status to published
      const { data, error } = await supabase
        .from('lessons')
        .update({ 
          mux_playback_id: playbackId,
          video_processing_status: 'ready',
          status: 'published'
        })
        .eq('mux_asset_id', assetId)
        .select('id, title');
      
      if (error) {
        console.error('Error updating lesson with playback ID:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
      
      if (data && data.length > 0) {
        console.log(`Updated lesson "${data[0].title}" (${data[0].id}) with playback ID ${playbackId} and set status to published`);
      } else {
        console.warn(`No lesson found with asset ID ${assetId}`);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
