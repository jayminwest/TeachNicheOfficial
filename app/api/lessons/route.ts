import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET() {
  try {
    // Create the Supabase client using our service role approach
    const supabase = createServerSupabaseClient();
    
    console.log('Using service role Supabase client for lessons API with direct SQL');
    
    // Try direct query with service role key first
    console.log('Attempting direct query with service role key');
    
    // First try a count query to test permissions
    const { count, error: countError } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting lessons:', countError);
      console.log('Service role key may not be working correctly');
      
      // Return empty array instead of error for better UX
      return NextResponse.json({ 
        lessons: [],
        debug: {
          error: countError,
          serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5) + '...' || 'not set',
          publicKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5) + '...' || 'not set'
        }
      });
    }
    
    console.log(`Found ${count} lessons`);
    
    // Now fetch the actual lessons
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lessons with direct query:', error);
      return NextResponse.json(
        { 
          error: { message: 'Failed to fetch lessons' },
          debug: { error }
        },
        { status: 500 }
      );
    }
    
    // Only log in development environment
    if (process.env.NODE_ENV === 'development' && lessons && lessons.length > 0) {
      console.log('Lesson schema sample:', Object.keys(lessons[0]));
    }
    
    // Transform the data to match the client-side expected format
    const transformedLessons = (lessons || []).map(lesson => {
      // Handle both RPC JSON result and direct query result
      const lessonData = typeof lesson === 'string' ? JSON.parse(lesson) : lesson;
      
      return {
        id: lessonData.id || '',
        title: lessonData.title || 'Untitled Lesson',
        description: lessonData.description || 'No description available',
        price: typeof lessonData.price === 'number' ? lessonData.price : 0,
        thumbnailUrl: lessonData.thumbnail_url || '', // Map snake_case to camelCase
        creatorId: lessonData.creator_id || '',
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
