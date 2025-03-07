import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';

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
