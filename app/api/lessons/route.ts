import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/client';
import { getCurrentUser } from '@/app/services/auth';

// Define proper types instead of any
interface RequestWithQuery {
  url?: string;
  query?: Record<string, string>;
  body?: string | Record<string, unknown>;
}

interface ResponseWithStatus {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
}

interface LessonData {
  title: string;
  description: string;
  price?: number;
  muxAssetId?: string;
  muxPlaybackId?: string;
  content?: string;
  status?: string;
  category?: string;
}

// Export the handler functions for testing
export async function getLessons(req: RequestWithQuery, res: ResponseWithStatus) {
  try {
    const url = new URL(req.url || `http://localhost?${new URLSearchParams(req.query || {})}`);
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    
    const supabase = createClient();
    
    // Start with the base query
    const baseQuery = supabase.from('lessons');
    
    // Select all fields
    const selectQuery = baseQuery.select('*');
    
    // Apply category filter if provided
    let filteredQuery = selectQuery;
    if (category) {
      filteredQuery = selectQuery.eq('category', category);
    }
    
    // Apply sorting
    let sortedQuery = filteredQuery;
    if (sort === 'newest') {
      sortedQuery = filteredQuery.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      sortedQuery = filteredQuery.order('created_at', { ascending: true });
    } else if (sort === 'price_low') {
      sortedQuery = filteredQuery.order('price', { ascending: true });
    } else if (sort === 'price_high') {
      sortedQuery = filteredQuery.order('price', { ascending: false });
    }
    
    // Apply limit
    const limitedQuery = sortedQuery.limit(limit);
    
    // Execute the query
    const { data: lessons, error: queryError } = await limitedQuery;
    
    if (queryError) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'Failed to fetch lessons' } }));
      return;
    }
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ lessons }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message: 'Internal server error' } }));
  }
}

export async function createLesson(req: RequestWithQuery, res: ResponseWithStatus) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }

    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Title and description are required' }));
      return;
    }

    // Create lesson in Supabase
    const lessonData = {
      title,
      description,
      price: price || 0,
      content,
      status,
      user_id: user.id,
      category,
      mux_asset_id: muxAssetId || 'test-asset-id',
      mux_playback_id: muxPlaybackId || 'test-playback-id'
    };

    const supabase = createClient();
    const baseQuery = supabase.from('lessons');
    const insertQuery = baseQuery.insert(lessonData);
    const selectQuery = insertQuery.select();
    const { data: lesson, error: insertError } = await selectQuery.single();

    if (insertError) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'Failed to create lesson',
        details: insertError.message
      }));
      return;
    }

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(lesson));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'Failed to create lesson',
      details: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}

export async function updateLesson(req: RequestWithQuery, res: ResponseWithStatus) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }

    const id = req.query?.id;
    if (!id) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson ID is required' }));
      return;
    }

    // Check if user has permission to update this lesson
    // Instead of using hasPermission, we'll check if the user is the owner of the lesson
    const supabase = createClient();
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('user_id')
      .eq('id', id)
      .single();
      
    if (lessonError || !lesson) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson not found' }));
      return;
    }
    
    const hasAccess = lesson.user_id === user.id;
    if (!hasAccess) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'You do not have permission to update this lesson' }));
      return;
    }

    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const baseQuery = supabase.from('lessons');
    const matchQuery = baseQuery.match({ id });
    const updateQuery = matchQuery.update(data);
    const selectQuery = updateQuery.select();
    const { data: updatedLesson, error: updateError } = await selectQuery.single();

    if (updateError) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to update lesson' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(updatedLesson));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

export async function deleteLesson(req: RequestWithQuery, res: ResponseWithStatus) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }

    const id = req.query?.id;
    if (!id) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson ID is required' }));
      return;
    }

    const supabase = createClient();
    
    // Check if lesson exists
    const baseQuery = supabase.from('lessons');
    const selectQuery = baseQuery.select('*');
    const eqQuery = selectQuery.eq('id', id);
    const { data: lesson, error: lessonError } = await eqQuery.single();

    if (lessonError || !lesson) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson not found' }));
      return;
    }

    // Check if user has permission to delete this lesson
    // Instead of using hasPermission, we'll check if the user is the owner of the lesson
    const hasAccess = lesson.user_id === user.id;
    if (!hasAccess) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'You do not have permission to delete this lesson' }));
      return;
    }

    const deleteQuery = supabase.from('lessons');
    const matchQuery = deleteQuery.match({ id });
    const { error: deleteError } = await matchQuery.delete();

    if (deleteError) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to delete lesson' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// App Router handler for POST
export async function POST(request: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      title,
      description,
      price: price || 0,
      content,
      status,
      user_id: user.id,
      category,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId
    };

    const supabase = createClient();
    const baseQuery = supabase.from('lessons');
    const insertQuery = baseQuery.insert(lessonData);
    const selectQuery = insertQuery.select();
    const { data: lesson, error: insertError } = await selectQuery.single();

    if (insertError) {
      return NextResponse.json(
        { 
          error: 'Failed to create lesson',
          details: insertError.message
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

// Add GET, PUT, DELETE handlers for App Router
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'newest';
  
  try {
    const supabase = createClient();
    const baseQuery = supabase.from('lessons');
    const selectQuery = baseQuery.select('*');
    
    let filteredQuery = selectQuery;
    if (category) {
      filteredQuery = selectQuery.eq('category', category);
    }
    
    // Apply sorting
    let sortedQuery = filteredQuery;
    if (sort === 'newest') {
      sortedQuery = filteredQuery.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      sortedQuery = filteredQuery.order('created_at', { ascending: true });
    } else if (sort === 'price_low') {
      sortedQuery = filteredQuery.order('price', { ascending: true });
    } else if (sort === 'price_high') {
      sortedQuery = filteredQuery.order('price', { ascending: false });
    }
    
    // Apply limit
    const limitedQuery = sortedQuery.limit(limit);
    
    // Execute the query
    const { data: lessons, error: queryError } = await limitedQuery;
    
    if (queryError) {
      return NextResponse.json(
        { error: { message: 'Failed to fetch lessons' } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
