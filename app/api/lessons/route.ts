import { NextResponse } from 'next/server';
import { supabase } from '@/app/services/supabase';

// Export the handler functions for testing
export async function getLessons(req: any, res: any) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    
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
    // Get auth token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing or invalid authorization header' }));
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid authentication token' }));
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
      status = 'published'
    } = data;

    // Validate required fields
    if (!title || !description) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Title and description are required' }));
      return;
    }

    if (!muxAssetId || !muxPlaybackId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Video upload incomplete. Both asset ID and playback ID are required' }));
      return;
    }

    // Create lesson in Supabase
    const lessonData = {
      id: crypto.randomUUID(),
      title,
      description,
      price: price || 0,
      content,
      status,
      creator_id: user.id,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      version: 1
    };

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select('id, title, description, price, creator_id, content, status, mux_asset_id, version')
      .single();

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'Failed to create lesson',
        details: error.message,
        code: error.code
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
    // Get auth token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing or invalid authorization header' }));
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid authentication token' }));
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
    const { data: lesson } = await supabase
      .from('lessons')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!lesson || lesson.creator_id !== user.id) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'You do not have permission to update this lesson' }));
      return;
    }

    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
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
    // Get auth token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing or invalid authorization header' }));
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid authentication token' }));
      return;
    }

    const id = req.query?.id;
    if (!id) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson ID is required' }));
      return;
    }

    // Check if user has permission to delete this lesson
    const { data: lesson } = await supabase
      .from('lessons')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!lesson) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Lesson not found' }));
      return;
    }

    if (lesson.creator_id !== user.id) {
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
    // Get auth token from request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
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
      status = 'published'
    } = data;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!muxAssetId || !muxPlaybackId) {
      return NextResponse.json(
        { error: 'Video upload incomplete. Both asset ID and playback ID are required' },
        { status: 400 }
      );
    }

    // Create lesson in Supabase with the upload ID for now
    // Generate a UUID for the new lesson
    const lessonData = {
      id: crypto.randomUUID(),
      title,
      description,
      price: price || 0,
      content,
      status,
      creator_id: user.id,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      version: 1
    };

    console.log('Creating lesson with data:', lessonData);

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select('id, title, description, price, creator_id, content, status, mux_asset_id, version')
      .single();

    if (error) {
      console.error('Lesson creation error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create lesson',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Lesson creation error:', error);
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
