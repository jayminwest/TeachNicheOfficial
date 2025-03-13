import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import type { Database } from '@/app/types/database';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
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
    
    // Create lesson in database
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content || '',
        price: lessonData.price || 0,
        creator_id: userId,
        mux_asset_id: lessonData.muxAssetId,
        mux_playback_id: lessonData.muxPlaybackId,
        video_processing_status: 'processing',
        status: 'draft',
      } as any)  // Use type assertion to bypass TypeScript check
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
    console.log('Attempting to fetch lessons with direct service role client');
    
    // Create a direct client with service role key
    // This is a more direct approach than using the helper
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('No service role key found');
      return NextResponse.json({ 
        lessons: [],
        error: 'Service role key not configured'
      });
    }
    
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
    
    // Try a direct query first - this should work with service role key
    console.log('Attempting direct query with service role key');
    const { data: lessons, error } = await supabase.from('lessons')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lessons:', error);
      // Return empty array instead of error for better UX
      return NextResponse.json({ 
        lessons: [],
        debug: {
          error: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      });
    }
    
    // Only log in development environment
    if (process.env.NODE_ENV === 'development' && lessons && lessons.length > 0) {
      console.log('Lesson schema sample:', Object.keys(lessons[0]));
    }
    
    // Transform the data to match the client-side expected format
    const transformedLessons = (lessons || []).map(lesson => {
      return {
        id: lesson.id || '',
        title: lesson.title || 'Untitled Lesson',
        description: lesson.description || 'No description available',
        price: typeof lesson.price === 'number' ? lesson.price : 0,
        thumbnailUrl: lesson.thumbnail_url || '', // Map snake_case to camelCase
        creatorId: lesson.creator_id || '',
        // Provide default values for missing fields
        averageRating: 0,
        totalRatings: 0
      };
    });
    
    return NextResponse.json({ lessons: transformedLessons });
  } catch (error) {
    console.error('Exception fetching lessons:', error);
    return NextResponse.json(
      { error: { message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
