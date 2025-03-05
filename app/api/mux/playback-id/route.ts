import { NextResponse } from 'next/server';
import { getMuxClient } from '@/app/services/mux';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId parameter' },
        { status: 400 }
      );
    }
    
    // Get the Mux client directly
    const mux = getMuxClient();
    
    try {
      // Get the asset from Mux
      const asset = await mux.video.assets.retrieve(assetId);
      
      // Check if the asset has playback IDs
      if (!asset.playback_ids || asset.playback_ids.length === 0) {
        // If the asset is ready but has no playback ID, create one
        if (asset.status === 'ready') {
          console.log('Creating new playback ID for ready asset');
          try {
            // Always create public playback IDs in development
            const policy = process.env.NODE_ENV === 'development' ? 'public' : 'signed';
            console.log(`Creating playback ID with policy: ${policy}`);
            
            const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
              policy
            });
            
            if (newPlaybackId && newPlaybackId.id) {
              console.log('Created new playback ID:', newPlaybackId.id);
              return NextResponse.json({ playbackId: newPlaybackId.id });
            }
          } catch (createError) {
            console.error('Error creating playback ID:', createError);
            return NextResponse.json(
              { 
                error: 'Failed to create playback ID',
                details: createError instanceof Error ? createError.message : String(createError)
              },
              { status: 500 }
            );
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
      
      // In development, check if we have a public playback ID
      if (process.env.NODE_ENV === 'development') {
        // Look for a public playback ID first
        const publicId = asset.playback_ids.find(id => id.policy === 'public');
        
        if (publicId) {
          console.log('Found existing public playback ID:', publicId.id);
          return NextResponse.json({ playbackId: publicId.id });
        } else {
          // If no public ID exists in development, create one
          console.log('No public playback ID found in development, creating one');
          try {
            const newPlaybackId = await mux.video.assets.createPlaybackId(assetId, {
              policy: 'public'
            });
            
            if (newPlaybackId && newPlaybackId.id) {
              console.log('Created new public playback ID:', newPlaybackId.id);
              return NextResponse.json({ playbackId: newPlaybackId.id });
            }
          } catch (createError) {
            console.error('Error creating public playback ID:', createError);
          }
        }
      }
      
      // Return the first playback ID as fallback
      const playbackId = asset.playback_ids[0].id;
      console.log(`Returning playback ID: ${playbackId} with policy: ${asset.playback_ids[0].policy}`);
      return NextResponse.json({ playbackId });
    } catch (muxError) {
      console.error('Error retrieving asset from Mux:', muxError);
      return NextResponse.json(
        { 
          error: 'Failed to get asset from Mux API', 
          details: muxError instanceof Error ? muxError.message : String(muxError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in playback-id route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
