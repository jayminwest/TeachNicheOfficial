import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAssetStatus } from '@/lib/mux';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get authenticated user session
    const supabaseServer = createServerComponentClient({ cookies });
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
        creator_id: session.user.id,
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
