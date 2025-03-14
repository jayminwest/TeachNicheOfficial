import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createProductForLesson, createPriceForProduct, canCreatePaidLessons } from '@/app/services/stripe';
import { LessonUpdateData } from '@/app/types/lesson';
import { createServerSupabaseClient } from "@/app/lib/supabase/server";

export async function PATCH(
  request: NextRequest
) {
  try {
    // Get the lesson ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const lessonId = pathParts[pathParts.length - 1];
    
    // Get the current user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is the owner of the lesson
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('creator_id')
      .eq('id', lessonId)
      .single();
      
    if (fetchError) {
      return NextResponse.json(
        { message: 'Failed to verify lesson ownership', details: fetchError },
        { status: 500 }
      );
    }
    
    const isOwner = lesson?.creator_id === session.user.id;
    
    if (!isOwner) {
      return NextResponse.json(
        { message: 'You do not have permission to edit this lesson' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Get the current lesson to check for price changes
    const { data: currentLesson, error: lessonFetchError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonFetchError || !currentLesson) {
      return NextResponse.json(
        { message: 'Failed to fetch current lesson', details: lessonFetchError },
        { status: 500 }
      );
    }

    // Check if price is being updated and is greater than 0
    if (data.price !== undefined && 
        data.price > 0 && 
        data.price !== currentLesson.price) {
      
      // Verify user can create paid lessons
      const canCreatePaid = await canCreatePaidLessons(session.user.id, supabase);
      if (!canCreatePaid) {
        return NextResponse.json(
          { message: 'Stripe account required for paid lessons' },
          { status: 403 }
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
          return NextResponse.json(
            { message: 'Stripe account required' },
            { status: 403 }
          );
        }

        // Create or get product ID
        let productId = currentLesson.stripe_product_id;
        if (!productId) {
          // Create a new product if one doesn't exist
          productId = await createProductForLesson({
            id: lessonId,
            title: data.title || currentLesson.title,
            description: data.description || currentLesson.description
          });
        }

        // Create a new price
        const priceId = await createPriceForProduct(productId, data.price);

        // Store the previous price ID if it exists
        let previousPriceIds = currentLesson.previous_stripe_price_ids || [];
        if (currentLesson.stripe_price_id) {
          previousPriceIds = [...previousPriceIds, currentLesson.stripe_price_id];
        }

        // Update data with Stripe IDs
        data.stripe_product_id = productId;
        data.stripe_price_id = priceId;
        data.previous_stripe_price_ids = previousPriceIds;
      } catch (error) {
        console.error('Stripe product/price update error:', error);
        return NextResponse.json(
          { message: 'Failed to update Stripe product/price', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }
    
    // Update the lesson
    const updateData = {
      title: data.title,
      description: data.description,
      content: data.content,
      price: data.price,
      mux_asset_id: data.muxAssetId,
      mux_playback_id: data.muxPlaybackId,
      stripe_product_id: data.stripe_product_id,
      stripe_price_id: data.stripe_price_id,
      previous_stripe_price_ids: data.previous_stripe_price_ids
    } as LessonUpdateData;
    
    const { data: updatedLesson, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { message: 'Failed to update lesson', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: NextRequest
) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const lessonId = pathParts[pathParts.length - 1];
    
    // Get the current user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is the owner of the lesson
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('creator_id')
      .eq('id', lessonId)
      .single();
      
    if (fetchError) {
      return NextResponse.json(
        { message: 'Failed to verify lesson ownership', details: fetchError },
        { status: 500 }
      );
    }
    
    const isOwner = lesson?.creator_id === session.user.id;
    
    if (!isOwner) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this lesson' },
        { status: 403 }
      );
    }
    
    // Soft delete the lesson
    const { error } = await supabase
      .from('lessons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', lessonId);
    
    if (error) {
      return NextResponse.json(
        { message: 'Failed to delete lesson', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Extract the ID from params and use it after all async operations
    const lessonId = params.id;
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson:', error);
      return NextResponse.json(
        { error: 'Error loading lesson' },
        { status: 500 }
      );
    }

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
