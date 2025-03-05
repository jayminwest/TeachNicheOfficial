import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(
  request: Request,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Make sure to await cookies()
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const lessonId = context.params.id;
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the creator of the lesson
    if (lesson.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to publish this lesson' },
        { status: 403 }
      );
    }
    
    // Update the lesson status to published
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to publish lesson' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Lesson published successfully'
    });
  } catch (error) {
    console.error('Error in publish API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
