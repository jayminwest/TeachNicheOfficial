import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAssetStatus } from '@/lib/mux';

export async function POST(request: Request) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { 
      title, 
      description, 
      price, 
      muxAssetId,
      content = '',
      status = 'draft'
    } = data;

    // Validate required fields
    if (!title || !description || !muxAssetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Mux asset details
    const muxAsset = await getAssetStatus(muxAssetId);
    if (!muxAsset.playbackId) {
      return NextResponse.json(
        { error: 'Video processing not complete' },
        { status: 400 }
      );
    }

    // Create lesson in Supabase
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        title,
        description,
        price,
        content,
        status,
        creator_id: user.id,
        content_url: `https://stream.mux.com/${muxAsset.playbackId}/high.mp4`,
        version: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Lesson creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create lesson' },
        { status: 500 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
