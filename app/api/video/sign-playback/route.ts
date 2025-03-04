import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { useLessonAccess } from '@/app/hooks/use-lesson-access';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { playbackId, lessonId } = await request.json();

    if (!playbackId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the user session
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if the user has access to this lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('creator_id, price')
      .eq('id', lessonId)
      .single();

    if (lessonError) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // If the user is the creator or the lesson is free, they have access
    let hasAccess = lesson.creator_id === userId || lesson.price === 0;

    // If not the creator and not free, check if they've purchased it
    if (!hasAccess) {
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('status')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .limit(1);

      if (!purchaseError && purchases && purchases.length > 0) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate a signed JWT token for Mux
    const token = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        kid: process.env.MUX_SIGNING_KEY_ID,
      },
      process.env.MUX_PRIVATE_KEY!,
      { algorithm: 'RS256' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error signing playback token:', error);
    return NextResponse.json(
      { error: 'Failed to sign playback token' },
      { status: 500 }
    );
  }
}
