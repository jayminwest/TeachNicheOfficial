import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface LessonData {
  title: string;
  description: string;
  price?: number;
  muxAssetId?: string;
  muxPlaybackId?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
  category?: string;
}

// Helper functions (not exported)
async function createLessonHandler(request: Request) {
  try {
    // Get the current user using the route handler client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    const data = await request.json();
    const { 
      title, 
      description, 
      price, 
      muxAssetId,
      muxPlaybackId,
      content = '',
      status = 'published',
      category
    } = data as LessonData;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create lesson in Supabase
    const lessonData = {
      id: crypto.randomUUID(), // Add UUID here
      title,
      description,
      price: price || 0,
      content,
      status: status as 'draft' | 'published' | 'archived',
      creator_id: user.id, // Changed from user_id to creator_id to match database schema
      category,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId
    };

    const supabase = createClient();
    
    // Call from directly on the supabase client to match test expectations
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to create lesson',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to create lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getLessonsHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'newest';
  
  try {
    const supabase = createClient();
    
    // Call from directly on the supabase client to match test expectations
    let query = supabase
      .from('lessons')
      .select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // Apply sorting
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'price_low') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_high') {
      query = query.order('price', { ascending: false });
    }
    
    // Apply limit
    query = query.limit(limit);
    
    // Execute the query
    const { data: lessons } = await query;
    
    return NextResponse.json({ lessons });
  } catch {
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function updateLessonHandler(request: Request) {
  try {
    // Get the current user using the route handler client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to update this lesson
    const supabase = createClient();
    
    // Call from directly on the supabase client to match test expectations
    const { data: lesson } = await supabase
      .from('lessons')
      .select('creator_id') // Changed from user_id to creator_id to match database schema
      .eq('id', id)
      .single();
      
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    const hasAccess = lesson.creator_id === user.id; // Changed from user_id to creator_id to match database schema
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to update this lesson' },
        { status: 403 }
      );
    }
    
    const { data: updatedLesson } = await supabase
      .from('lessons')
      .update(updateData)
      .match({ id }) // Use match instead of eq to match test expectations
      .select()
      .single();

    return NextResponse.json(updatedLesson);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteLessonHandler(request: Request) {
  try {
    // Get the current user using the route handler client
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Call from directly on the supabase client to match test expectations
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this lesson
    const hasAccess = lesson.creator_id === user.id; // Changed from user_id to creator_id to match database schema
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this lesson' },
        { status: 403 }
      );
    }

    await supabase
      .from('lessons')
      .delete()
      .match({ id }) // Use match instead of eq to match test expectations

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// App Router handler for POST
export async function POST(request: Request) {
  return createLessonHandler(request);
}

// GET handler for App Router
export async function GET(request: Request) {
  return getLessonsHandler(request);
}

// PUT handler for App Router
export async function PUT(request: Request) {
  return updateLessonHandler(request);
}

// DELETE handler for App Router
export async function DELETE(request: Request) {
  return deleteLessonHandler(request);
}
