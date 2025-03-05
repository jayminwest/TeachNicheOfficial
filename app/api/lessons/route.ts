import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { createClientSupabaseClient } from '@/app/lib/supabase/client';
import { z } from 'zod';
import { createProductForLesson, createPriceForProduct, canCreatePaidLessons } from '@/app/services/stripe';

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
  thumbnail_url: z.string().optional(),
  thumbnailUrl: z.string().optional(), // For backward compatibility
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
    const supabase = await createServerSupabaseClient();
    
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
      thumbnail_url,
      thumbnailUrl,
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
      // If video is still processing, set status to 'processing'
      status: muxAssetId && (!muxPlaybackId || muxPlaybackId === "") ? 'processing' : status,
      creator_id: session.user.id,
      category,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId || null, // Allow null playback ID for processing videos
      thumbnail_url: body.thumbnail_url || body.thumbnailUrl || null, // Ensure thumbnail URL is included
      stripe_product_id: null, // Will be updated after Stripe product creation
      stripe_price_id: null,   // Will be updated after Stripe price creation
      previous_stripe_price_ids: []
    };
    
    console.log("Creating lesson with data:", {
      ...lessonData,
      content: lessonData.content?.substring(0, 50) + (lessonData.content?.length > 50 ? '...' : ''),
    });

    // Check if this is a paid lesson
    if (price > 0) {
      // Verify user can create paid lessons
      const canCreatePaid = await canCreatePaidLessons(session.user.id, supabase);
      if (!canCreatePaid) {
        return createErrorResponse(
          'Stripe account required for paid lessons', 
          403, 
          'You must connect a Stripe account and complete onboarding to create paid lessons'
        );
      }

      try {
        // Get the user's Stripe account ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', session.user.id)
          .single();

        if (!profile?.stripe_account_id) {
          return createErrorResponse('Stripe account required', 403);
        }

        // Create a Stripe product for the lesson
        const productId = await createProductForLesson({
          id: lessonData.id,
          title,
          description
        });

        // Create a Stripe price for the product
        const priceId = await createPriceForProduct(productId, price);

        // Update the lesson data with Stripe IDs
        lessonData.stripe_product_id = productId;
        lessonData.stripe_price_id = priceId;
      } catch (error) {
        console.error('Stripe product/price creation error:', error);
        // Continue anyway, as the lesson is created
        // In a production environment, you might want to implement a background job to retry
      }
    }

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
      return NextResponse.json({ 
        error: { message: error.message } 
      }, { status: 500 });
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
    const supabase = await createServerSupabaseClient();
    
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
    
    const hasAccess = lesson.creator_id === session.user.id;
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
    const supabase = await createServerSupabaseClient();
    
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
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const data = await request.json();
    
    // Validate that we have at least the required fields
    if (!data.title || !data.description || !data.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // If we have an asset ID but no playback ID, set the status to 'processing'
    // Otherwise, set it to 'published'
    // Ensure muxPlaybackId is defined before checking
    const muxPlaybackId = data.muxPlaybackId || "";
    const isVideoProcessing = data.muxAssetId && (!muxPlaybackId || muxPlaybackId === "" || data.videoProcessing);
    const status = isVideoProcessing ? 'processing' : 'published';
    
    console.log(`Creating lesson with status: ${status}, video processing: ${isVideoProcessing}, muxPlaybackId: "${muxPlaybackId}"`);
    
    // Create the lesson
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        title: data.title,
        description: data.description,
        content: data.content,
        price: data.price || 0,
        thumbnail_url: data.thumbnail_url || data.thumbnailUrl || null,
        mux_asset_id: data.muxAssetId || null,
        mux_playback_id: data.muxPlaybackId === "" ? null : data.muxPlaybackId,
        creator_id: session.user.id,
        status: status
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lesson:', error);
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
    }
    
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error in POST /api/lessons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
