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
      
      // First, try to find any lessons with this upload ID
      const { data: lessons, error: findError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('mux_asset_id', cleanUploadId);
      
      if (findError) {
        console.error('Error finding lessons with upload ID:', findError);
      } else {
        console.log(`Found ${lessons?.length || 0} lessons with upload ID ${uploadId}`);
      }
      
      // Update any lessons with this upload ID
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_asset_id: assetId,
        })
        .eq('mux_asset_id', cleanUploadId);
      
      if (error) {
        console.error('Error updating lesson with asset ID:', error);
      } else {
        console.log(`Updated lessons with upload ID ${uploadId} to asset ID ${assetId}`);
      }
      
      // Also check for temporary IDs that might match
      if (uploadId.includes('temp_')) {
        // If the upload ID itself is a temp ID, extract the real ID
        const realId = uploadId.replace('temp_', '');
        console.log(`Extracted real ID ${realId} from temp ID ${uploadId}`);
        
        const { error: realError } = await supabase
          .from('lessons')
          .update({ 
            mux_asset_id: assetId,
          })
          .eq('mux_asset_id', realId);
        
        if (realError) {
          console.error('Error updating lesson with real ID:', realError);
        }
      } else {
        // Check for lessons with temp IDs
        const tempId = `temp_${uploadId}`;
        console.log(`Checking for lessons with temp ID ${tempId}`);
        
        const { error: tempError } = await supabase
          .from('lessons')
          .update({ 
            mux_asset_id: assetId,
          })
          .eq('mux_asset_id', tempId);
        
        if (tempError) {
          console.error('Error updating lesson with temp ID:', tempError);
        }
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
      
      // Update the lesson with the playback ID
      const { error } = await supabase
        .from('lessons')
        .update({ 
          mux_playback_id: playbackId,
          status: 'published'
        })
        .eq('mux_asset_id', assetId);
      
      if (error) {
        console.error('Error updating lesson with playback ID:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
