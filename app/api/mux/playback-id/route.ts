import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { getMuxClient } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    // Get the asset ID from the query parameters
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const isFree = searchParams.get('isFree') === 'true';
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }
    
    // First try to get the playback ID from the database
    const supabase = await createServerSupabaseClient();
    
    // Query the database for the lesson with this asset ID
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('mux_playback_id, video_processing_status')
      .eq('mux_asset_id', assetId)
      .single();
    
    // If we found a playback ID in the database, return it
    if (!error && lesson && lesson.mux_playback_id) {
      console.log(`Found playback ID in database: ${lesson.mux_playback_id}`);
      return NextResponse.json({ 
        playbackId: lesson.mux_playback_id,
        status: lesson.video_processing_status || 'ready'
      });
    }
    
    // If not in database or there was an error, try to get it directly from Mux
    console.log(`Playback ID not found in database, checking Mux API for asset: ${assetId}`);
    
    try {
      // Get the Mux client
      const mux = getMuxClient();
      
      // Get the asset from Mux
      const asset = await mux.video.assets.retrieve(assetId);
      
      // Check if the asset has playback IDs
      if (!asset.playback_ids || asset.playback_ids.length === 0) {
        // If the asset is ready but has no playback ID, create one
        if (asset.status === 'ready') {
          console.log('Creating new playback ID for ready asset');
          try {
            // Use the appropriate policy based on whether the content is free
            const policy = isFree ? 'public' : 'signed';
            console.log(`Creating playback ID with policy: ${policy}`);
            
            const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
              policy
            });
            
            if (newPlaybackId && newPlaybackId.id) {
              console.log('Created new playback ID:', newPlaybackId.id);
              
              // Update the database with the new playback ID
              await supabase
                .from('lessons')
                .update({ 
                  mux_playback_id: newPlaybackId.id,
                  video_processing_status: 'ready'
                })
                .eq('mux_asset_id', assetId);
              
              return NextResponse.json({ 
                playbackId: newPlaybackId.id,
                status: 'ready'
              });
            }
          } catch (createError) {
            console.error('Error creating playback ID:', createError);
          }
        }
        
        // If asset is not ready, return appropriate status
        if (asset.status !== 'ready') {
          return NextResponse.json(
            { 
              error: 'Asset not ready for playback',
              status: asset.status,
              assetId: assetId
            },
            { status: 202 }
          );
        }
        
        return NextResponse.json(
          { error: 'No playback IDs found for this asset' },
          { status: 404 }
        );
      }
      
      // Check if we have a playback ID with the right policy
      const desiredPolicy = isFree ? 'public' : 'signed';
      const matchingId = asset.playback_ids.find(id => id.policy === desiredPolicy);
      
      if (matchingId) {
        console.log(`Found existing ${desiredPolicy} playback ID:`, matchingId.id);
        
        // Update the database with this playback ID
        await supabase
          .from('lessons')
          .update({ 
            mux_playback_id: matchingId.id,
            video_processing_status: 'ready'
          })
          .eq('mux_asset_id', assetId);
        
        return NextResponse.json({ 
          playbackId: matchingId.id,
          status: 'ready'
        });
      } else {
        // If no matching policy ID exists, create one
        console.log(`No ${desiredPolicy} playback ID found, creating one`);
        try {
          const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
            policy: desiredPolicy
          });
          
          if (newPlaybackId && newPlaybackId.id) {
            console.log(`Created new ${desiredPolicy} playback ID:`, newPlaybackId.id);
            
            // Update the database with the new playback ID
            await supabase
              .from('lessons')
              .update({ 
                mux_playback_id: newPlaybackId.id,
                video_processing_status: 'ready'
              })
              .eq('mux_asset_id', assetId);
            
            return NextResponse.json({ 
              playbackId: newPlaybackId.id,
              status: 'ready'
            });
          }
        } catch (createError) {
          console.error(`Error creating ${desiredPolicy} playback ID:`, createError);
        }
      }
      
      // Return the first playback ID as fallback if we couldn't create a new one
      const playbackId = asset.playback_ids[0].id;
      console.log(`Returning fallback playback ID: ${playbackId} with policy: ${asset.playback_ids[0].policy}`);
      
      // Update the database with this playback ID
      await supabase
        .from('lessons')
        .update({ 
          mux_playback_id: playbackId,
          video_processing_status: 'ready'
        })
        .eq('mux_asset_id', assetId);
      
      return NextResponse.json({ 
        playbackId,
        status: 'ready'
      });
    } catch (muxError) {
      console.error('Error retrieving asset from Mux:', muxError);
      
      // If we couldn't get it from Mux either, return an error
      return NextResponse.json(
        { 
          error: 'Playback ID not found in database or Mux API',
          details: muxError instanceof Error ? muxError.message : String(muxError)
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error retrieving playback ID:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve playback ID' },
      { status: 500 }
    );
  }
}
