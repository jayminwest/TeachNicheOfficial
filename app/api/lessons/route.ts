import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
      muxPlaybackId,
      content = '',
      status = 'draft'
    } = data;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!muxAssetId || !muxPlaybackId) {
      return NextResponse.json(
        { error: 'Video upload incomplete. Both asset ID and playback ID are required' },
        { status: 400 }
      );
    }

    // Create lesson in Supabase with the upload ID for now
    // Generate a UUID for the new lesson
    const lessonData = {
      id: crypto.randomUUID(),
      title,
      description,
      price: price || 0,
      content,
      status,
      creator_id: user.id,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      version: 1
    };

    console.log('Creating lesson with data:', lessonData);

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select('id, title, description, price, creator_id, content, status, mux_asset_id, version')
      .single();

    if (error) {
      console.error('Lesson creation error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create lesson',
          details: error.message,
          code: error.code
        },
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
