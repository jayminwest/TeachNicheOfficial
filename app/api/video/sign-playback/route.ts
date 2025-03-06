import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { playbackId, lessonId } = await request.json();

    if (!playbackId) {
      console.error('Missing playbackId in request');
      return NextResponse.json(
        { error: 'Missing playbackId parameter' },
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

    // If lessonId is provided, check access permissions
    let hasAccess = true; // Default to true if no lessonId is provided
    
    if (lessonId) {
      // Check if the user has access to this lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('creator_id, price')
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        console.error('Lesson not found:', lessonError);
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        );
      }

      // If the user is the creator or the lesson is free, they have access
      hasAccess = lesson.creator_id === userId || lesson.price === 0;

      // If not the creator and not free, check if they've purchased it
      if (!hasAccess) {
        const { data: purchases, error: purchaseError } = await supabase
          .from('purchases')
          .select('status')
          .eq('lesson_id', lessonId)
          .eq('user_id', userId)
          .eq('status', 'completed')
          .limit(1);

        if (purchaseError) {
          console.error('Error checking purchases:', purchaseError);
        }

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
    }

    // Make sure we have the required environment variables
    const signingKey = process.env.MUX_SIGNING_KEY;
    const signingKeyId = process.env.MUX_SIGNING_KEY_ID;
    
    if (!signingKey || !signingKeyId) {
      console.error('Missing MUX_SIGNING_KEY or MUX_SIGNING_KEY_ID environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate a signed JWT token for Mux
    const token = jwt.sign(
      {
        sub: playbackId,
        aud: 'v',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        kid: signingKeyId,
      },
      signingKey,
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
