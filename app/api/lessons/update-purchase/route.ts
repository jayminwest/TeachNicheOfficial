import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { lessonId, sessionId, paymentIntentId } = body;

    if (!lessonId || (!sessionId && !paymentIntentId)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the user session
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // First, check if there's a purchase record
    let query = supabase
      .from('purchases')
      .select('id, status')
      .eq('lesson_id', lessonId);
      
    // Add user ID filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (sessionId) {
      query = query.eq('stripe_session_id', sessionId);
    } else if (paymentIntentId) {
      query = query.eq('payment_intent_id', paymentIntentId);
    }

    const { data: purchases, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching purchase:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch purchase' },
        { status: 500 }
      );
    }

    // If no purchase found, create one
    if (!purchases || purchases.length === 0) {
      // Get the lesson details
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('price, creator_id')
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        return NextResponse.json(
          { error: 'Failed to fetch lesson' },
          { status: 500 }
        );
      }

      // Ensure lesson is properly typed
      const typedLesson = lesson as {
        price: number;
        creator_id: string;
      };
      
      // Calculate fees
      const price = typedLesson.price;
      const platformFee = Math.round(price * 0.1 * 100) / 100;
      const creatorEarnings = Math.round((price - platformFee) * 100) / 100;

      // Create a new purchase record
      const purchaseData = {
        lesson_id: lessonId,
        user_id: userId,
        creator_id: typedLesson.creator_id,
        amount: price,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        fee_percentage: 15,
        status: 'completed',
        stripe_session_id: sessionId || null,
        payment_intent_id: paymentIntentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        metadata: {
          created_via: 'manual_update'
        }
      };
      
      const { data: newPurchase, error: createError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating purchase:', createError);
        return NextResponse.json(
          { error: 'Failed to create purchase' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Purchase created successfully',
        purchaseId: newPurchase?.id || 'unknown'
      });
    }

    // If purchase exists but is not completed, update it
    const purchase = purchases[0] as { id: string; status: string } | undefined;
    if (purchase && purchase.status !== 'completed') {
      const updateData = {
        status: 'completed',
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', purchase.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating purchase:', updateError);
        return NextResponse.json(
          { error: 'Failed to update purchase' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Purchase updated successfully',
        purchaseId: updatedPurchase?.id || purchase.id
      });
    }

    // Purchase already completed
    return NextResponse.json({
      success: true,
      message: 'Purchase already completed',
      purchaseId: purchase?.id || 'unknown'
    });
  } catch (error) {
    console.error('Error in update purchase endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
