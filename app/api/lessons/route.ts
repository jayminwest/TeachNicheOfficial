import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get request body
    const lessonData = await request.json();
    
    // Validate required fields
    if (!lessonData.title || !lessonData.description) {
      return NextResponse.json(
        { message: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Create lesson in database with public status
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content || '',
        price: lessonData.price || 0,
        creator_id: userId,
        mux_asset_id: lessonData.muxAssetId,
        status: 'published', // Set as published immediately
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lesson:', error);
      return NextResponse.json(
        { message: 'Failed to create lesson', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { message: 'Failed to create lesson', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: lessons, error } = await supabase.from('lessons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json({ lessons: [] });
    }
    
    // Transform the data to match the client-side expected format
    const transformedLessons = (lessons || []).map(lesson => ({
      id: lesson.id || '',
      title: lesson.title || 'Untitled Lesson',
      description: lesson.description || 'No description available',
      price: typeof lesson.price === 'number' ? lesson.price : 0,
      thumbnailUrl: lesson.thumbnail_url || '',
      creatorId: lesson.creator_id || '',
      muxAssetId: lesson.mux_asset_id || '',
      averageRating: 0,
      totalRatings: 0
    }));
    
    return NextResponse.json({ lessons: transformedLessons });
  } catch (error) {
    console.error('Exception fetching lessons:', error);
    return NextResponse.json({ lessons: [] });
  }
}
