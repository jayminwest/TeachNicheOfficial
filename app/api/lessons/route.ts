import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  try {
    // Try both authentication methods for better compatibility
    let userId;
    
    // Method 1: Using createServerSupabaseClient
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      userId = session.user.id;
    } else {
      // Method 2: Using createRouteHandlerClient
      const routeClient = createRouteHandlerClient({ cookies });
      const { data: { session: routeSession } } = await routeClient.auth.getSession();
      
      if (routeSession) {
        userId = routeSession.user.id;
      } else {
        console.error('No authenticated session found');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // userId is now defined from either method
    
    // Get request body
    const lessonData = await request.json();
    
    // Validate required fields
    if (!lessonData.title || !lessonData.description) {
      return NextResponse.json(
        { message: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Log the data we're about to insert
    console.log('Creating lesson with data:', {
      title: lessonData.title,
      description: lessonData.description,
      content: lessonData.content ? `${lessonData.content.substring(0, 20)}...` : '',
      price: lessonData.price || 0,
      creator_id: userId,
      mux_asset_id: lessonData.muxAssetId,
    });
    
    try {
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
      
      console.log('Lesson created successfully:', lesson);
      return NextResponse.json(lesson);
    } catch (insertError) {
      console.error('Exception during lesson insert:', insertError);
      return NextResponse.json(
        { message: 'Exception during lesson creation', error: String(insertError) },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { 
        message: 'Failed to create lesson', 
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
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
