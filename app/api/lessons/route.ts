import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { createClientSupabaseClient } from '@/app/lib/supabase/client';
import { z } from 'zod';

// Add these helper functions at the top of the file

function createErrorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { 
      error: message,
      ...(details ? { details } : {})
    },
    { status }
  );
}

// Define validation schemas
const lessonCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  content: z.string()
    .max(50000, "Content must be less than 50000 characters")
    .optional(),
  muxAssetId: z.string().optional(),
  muxPlaybackId: z.string().optional(),
  price: z.number()
    .min(0, "Price must be positive")
    .max(999.99, "Price must be less than $1000")
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional()
});

// Helper functions (not exported)
async function createLessonHandler(request: Request) {
  try {
    // Get authenticated client - RLS will enforce permissions
    const supabase = createServerSupabaseClient();
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return createErrorResponse('Authentication required', 401);
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = lessonCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        'Validation error', 
        400, 
        validationResult.error.format()
      );
    }
    
    const { 
      title, 
      description, 
      price = 0, 
      muxAssetId,
      muxPlaybackId,
      content = '',
      status = 'published',
      category
    } = validationResult.data;

    // Create lesson in Supabase
    const lessonData = {
      id: crypto.randomUUID(),
      title,
      description,
      price,
      content,
      status,
      creator_id: session.user.id,
      category,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId
    };

    // With RLS, this will only succeed if the user is allowed to insert
    const { data: lesson, error: dbError } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();

    if (dbError) {
      return createErrorResponse('Failed to create lesson', 500, dbError.message);
    }

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return createErrorResponse(
      'Failed to create lesson',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function getLessonsHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'newest';
  
  try {
    const supabase = createClientSupabaseClient();
    
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
    const { data: lessons, error } = await query;
    
    if (error) {
      return createErrorResponse('Failed to fetch lessons', 500, error.message);
    }
    
    return NextResponse.json({ lessons });
  } catch (error) {
    return createErrorResponse(
      'Failed to fetch lessons',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function updateLessonHandler(request: Request) {
  try {
    // Get authenticated client - RLS will enforce permissions
    const supabase = createServerSupabaseClient();
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return createErrorResponse('Authentication required', 401);
    }
    
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return createErrorResponse('Lesson ID is required', 400);
    }

    // Check if user has permission to update this lesson
    const dbClient = createClientSupabaseClient();
    
    const { data: lesson, error: fetchError } = await dbClient
      .from('lessons')
      .select('creator_id')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      return createErrorResponse('Failed to fetch lesson', 500, fetchError.message);
    }
    
    if (!lesson) {
      return createErrorResponse('Lesson not found', 404);
    }
    
    const hasAccess = lesson.creator_id === user.id;
    if (!hasAccess) {
      return createErrorResponse('You do not have permission to update this lesson', 403);
    }
    
    const { data: updatedLesson, error: updateError } = await dbClient
      .from('lessons')
      .update(updateData)
      .match({ id })
      .select()
      .single();
      
    if (updateError) {
      return createErrorResponse('Failed to update lesson', 500, updateError.message);
    }

    return NextResponse.json(updatedLesson);
  } catch (error) {
    return createErrorResponse(
      'Failed to update lesson',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function deleteLessonHandler(request: Request) {
  try {
    // Get authenticated client - RLS will enforce permissions
    const supabase = createServerSupabaseClient();
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Lesson ID is required', 400);
    }

    const dbClient = createClientSupabaseClient();
    
    const { data: lesson, error: fetchError } = await dbClient
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      return createErrorResponse('Failed to fetch lesson', 500, fetchError.message);
    }

    if (!lesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check if user has permission to delete this lesson
    const hasAccess = lesson.creator_id === session.user.id;
    if (!hasAccess) {
      return createErrorResponse('You do not have permission to delete this lesson', 403);
    }

    const { error: deleteError } = await dbClient
      .from('lessons')
      .delete()
      .match({ id });
      
    if (deleteError) {
      return createErrorResponse('Failed to delete lesson', 500, deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(
      'Failed to delete lesson',
      500,
      error instanceof Error ? error.message : 'Unknown error'
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
