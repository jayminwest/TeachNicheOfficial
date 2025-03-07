import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
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
    
    // Use a simple raw SQL query to bypass RLS completely
    const { data: lessons, error } = await supabase.rpc('get_all_published_lessons');
    
    if (error) {
      console.error('Error fetching lessons with RPC:', error);
      
      // Try a direct SQL query as fallback
      console.log('Attempting fallback with direct SQL query');
      const { data: directData, error: directError } = await supabase.from('lessons')
        .select('*')
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (directError) {
        console.error('Fallback query also failed:', directError);
        return NextResponse.json({ lessons: [] });
      }
      
      lessons = directData;
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
