import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/client';
import { getCurrentUser, hasPermission } from '@/app/services/auth';

// Export the handler functions for testing
export async function getLessons(req: any, res: any) {
  try {
    const url = new URL(req.url || 'http://localhost?');
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    
    const supabase = createClient();
    let query = supabase.from('lessons').select('*');
    
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
    
    query = query.limit(limit);
    
    const { data: lessons, error } = await query;
    
    if (error) {
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

export async function createLesson(req: any, res: any) {
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
    } = data;

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
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'Failed to create lesson',
        details: error.message
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

export async function updateLesson(req: any, res: any) {
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
    const hasAccess = await hasPermission();
    if (!hasAccess) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'You do not have permission to update this lesson' }));
      return;
    }

    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const supabase = createClient();
    const { data: updatedLesson, error } = await supabase
      .from('lessons')
      .update(data)
      .match({ id })
      .select()
      .single();

    if (error) {
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

export async function deleteLesson(req: any, res: any) {
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
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (!lesson) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson not found' }));
      return;
    }

    // Check if user has permission to delete this lesson
    const hasAccess = await hasPermission();
    if (!hasAccess) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'You do not have permission to delete this lesson' }));
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .match({ id });

    if (error) {
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
    } = data;

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

// Add GET, PUT, DELETE handlers for App Router
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'newest';
  
  try {
    const supabase = createClient();
    let query = supabase.from('lessons').select('*');
    
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
    
    query = query.limit(limit);
    
    const { data: lessons, error } = await query;
    
    if (error) {
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
