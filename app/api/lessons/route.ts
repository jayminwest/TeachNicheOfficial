
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch lessons
    let query = supabase
      .from('lessons')
      .select('id, title, description, price, thumbnail_url, creator_id')
      .order('created_at', { ascending: false });
    
    // If user is logged in, include their lessons
    // Note: The public column might be named is_public or published
    if (user) {
      // Try to use creator_id without any filter on public status for now
      // Use type assertion to match the expected column type
      query = query.eq('creator_id', user.id as unknown as string);
    } else {
      // For anonymous users, just return all lessons for now
      // We'll implement proper visibility filtering once we confirm the schema
    }
    
    const { data: lessons, error } = await query;
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }
    
    // Log the actual schema of the first lesson to help debug
    if (lessons && lessons.length > 0) {
      console.log('Lesson schema sample:', Object.keys(lessons[0]));
    }
    
    // Transform the data to match the client-side expected format
    const transformedLessons = (lessons || []).map(lesson => ({
      id: lesson.id,
      title: lesson.title || 'Untitled Lesson',
      description: lesson.description || 'No description available',
      price: typeof lesson.price === 'number' ? lesson.price : 0,
      thumbnailUrl: lesson.thumbnail_url || '', // Map snake_case to camelCase
      creatorId: lesson.creator_id || '',
      // Provide default values for missing fields
      averageRating: 0,
      totalRatings: 0
    }));
    
    return NextResponse.json(transformedLessons);
  } catch (error) {
    console.error('Exception fetching lessons:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
