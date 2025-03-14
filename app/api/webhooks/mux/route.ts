import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const type = body.type;
    
    console.log(`Received Mux webhook: ${type}`, JSON.stringify(body, null, 2));
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    
    // Handle video.upload.asset_created event
    if (type === 'video.upload.asset_created') {
      const uploadId = body.data.upload_id;
      const assetId = body.data.asset_id;
      
      console.log(`Upload ${uploadId} created asset ${assetId}`);
      
      // Clean the upload ID (remove any query parameters)
      const cleanUploadId = uploadId.includes('?') ? uploadId.split('?')[0] : uploadId;
      console.log(`Using clean upload ID: ${cleanUploadId}`);
      
      // First, check if there are any lessons with this upload ID
      const { data: lessons, error: fetchError } = await supabase
        .from('lessons')
        .select('id')
        .eq('mux_asset_id', cleanUploadId);
      
      if (fetchError) {
        console.error('Error fetching lessons with upload ID:', fetchError);
      }
      
      // If no lessons found, we don't need to update anything
      if (!lessons || lessons.length === 0) {
        console.log(`No lessons found with upload ID ${cleanUploadId}`);
        return NextResponse.json({ success: true, message: 'No lessons to update' });
      }
      
      // Update the lessons with the asset ID
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_asset_id: assetId,
        })
        .eq('mux_asset_id', cleanUploadId);
      
      if (error) {
        console.error('Error updating lesson with asset ID:', error);
      } else {
        console.log(`Updated lessons with upload ID ${cleanUploadId} to asset ID ${assetId}`);
      }
    }
    
    // Handle video.asset.ready event
    if (type === 'video.asset.ready') {
      const assetId = body.data.id;
      const playbackIds = body.data.playback_ids || [];
      const playbackId = playbackIds.length > 0 ? playbackIds[0].id : null;
      
      if (!playbackId) {
        console.error('No playback ID found in asset.ready event');
        return NextResponse.json({ error: 'No playback ID found' }, { status: 400 });
      }
      
      console.log(`Asset ${assetId} is ready with playback ID ${playbackId}`);
      
      // Update the lesson with the playback ID
      const { data: updatedLessons, error } = await supabase
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
      
      console.log(`Updated ${updatedLessons?.length || 0} lessons with playback ID ${playbackId}:`, 
        updatedLessons?.map(l => `${l.id} (${l.title})`).join(', ') || 'none');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
