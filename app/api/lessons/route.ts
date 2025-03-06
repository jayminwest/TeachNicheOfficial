import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET() {
  try {
    // Create the Supabase client using our direct approach
    const supabase = createServerSupabaseClient();
    
    console.log('Using direct Supabase client for lessons API');
    
    // Fetch lessons with error handling
    const query = supabase
      .from('lessons')
      .select('id, title, description, price, thumbnail_url, creator_id')
      .order('created_at', { ascending: false });
    
    const { data: lessons, error } = await query;
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }
    
    // Only log in development environment
    if (process.env.NODE_ENV === 'development' && lessons && lessons.length > 0) {
      console.log('Lesson schema sample:', Object.keys(lessons[0]));
    }
    
    // Transform the data to match the client-side expected format
    const transformedLessons = (lessons || []).map(lesson => {
      // Ensure lesson is treated as a proper record type
      const typedLesson = lesson as {
        id: string;
        title?: string;
        description?: string;
        price?: number;
        thumbnail_url?: string;
        creator_id?: string;
      };
      
      return {
        id: typedLesson.id,
        title: typedLesson.title || 'Untitled Lesson',
        description: typedLesson.description || 'No description available',
        price: typeof typedLesson.price === 'number' ? typedLesson.price : 0,
        thumbnailUrl: typedLesson.thumbnail_url || '', // Map snake_case to camelCase
        creatorId: typedLesson.creator_id || '',
        // Provide default values for missing fields
        averageRating: 0,
        totalRatings: 0
      };
    });
    
    return NextResponse.json(transformedLessons);
  } catch (error) {
    console.error('Exception fetching lessons:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
