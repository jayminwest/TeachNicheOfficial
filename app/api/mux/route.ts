import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/client';
import * as muxService from '@/app/services/mux';
import { getCurrentUser } from '@/app/services/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a direct upload URL from Mux
    const { id, url } = await muxService.createUpload();

    return NextResponse.json({
      uploadId: id,
      uploadUrl: url
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}

export async function createUploadUrl(req: NextRequest, res: any) {
  try {
    // Authenticate the user
    const user = await getCurrentUser();
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Create a direct upload URL from Mux
    const { id, url } = await muxService.createUpload();

    res.json({
      uploadId: id,
      uploadUrl: url
    });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
}

export async function handleAssetCreated(req: NextRequest, res: any) {
  try {
    const body = await req.json();
    
    // Verify this is an asset.created event
    if (body.type !== 'video.asset.created') {
      res.status(400).json({ error: 'Invalid webhook event type' });
      return;
    }

    const assetId = body.data.id;
    const playbackId = body.data.playback_ids?.[0]?.id;

    if (!assetId) {
      res.status(400).json({ error: 'Missing asset ID' });
      return;
    }

    // Update the database with the asset information
    const supabase = createClient();
    const { error } = await supabase
      .from('videos')
      .update({
        asset_id: assetId,
        playback_id: playbackId,
        status: 'processing'
      })
      .eq('upload_id', body.data.upload_id);

    if (error) {
      console.error('Error updating video record:', error);
      res.status(500).json({ error: 'Database update failed' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling asset created webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleAssetReady(req: NextRequest, res: any) {
  try {
    const body = await req.json();
    
    // Verify this is an asset.ready event
    if (body.type !== 'video.asset.ready') {
      res.status(400).json({ error: 'Invalid webhook event type' });
      return;
    }

    const assetId = body.data.id;

    if (!assetId) {
      res.status(400).json({ error: 'Missing asset ID' });
      return;
    }

    // Update the database to mark the video as ready
    const supabase = createClient();
    const { error } = await supabase
      .from('videos')
      .update({
        status: 'ready',
        duration: body.data.duration,
        aspect_ratio: `${body.data.width}:${body.data.height}`
      })
      .eq('asset_id', assetId);

    if (error) {
      console.error('Error updating video record:', error);
      res.status(500).json({ error: 'Database update failed' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling asset ready webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
