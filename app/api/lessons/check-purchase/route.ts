import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/purchasesService';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { lessonId } = body;

    if (!lessonId) {
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

    // Check if the user has access to this lesson
    const { data: accessData, error: accessError } = await purchasesService.checkLessonAccess(
      userId,
      lessonId
    );

    if (accessError) {
      console.error('Error checking lesson access:', accessError);
      return NextResponse.json(
        { error: 'Failed to check lesson access' },
        { status: 500 }
      );
    }

    // If the user already has access, return success
    if (accessData?.hasAccess) {
      return NextResponse.json({
        hasAccess: true,
        purchaseStatus: accessData.purchaseStatus,
        purchaseDate: accessData.purchaseDate
      });
    }

    // If the user doesn't have access, check for pending purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, stripe_session_id, status, created_at')
      .eq('lesson_id', lessonId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json(
        { error: 'Failed to check purchases' },
        { status: 500 }
      );
    }

    // If no purchases found, return no access
    if (!purchases || purchases.length === 0) {
      return NextResponse.json({
        hasAccess: false,
        purchaseStatus: 'none'
      });
    }

    const latestPurchase = purchases[0];

    // If the purchase is already completed, return access
    if (latestPurchase.status === 'completed') {
      return NextResponse.json({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: latestPurchase.created_at
      });
    }

    // If the purchase is pending, try to update it
    if (latestPurchase.status === 'pending' && latestPurchase.stripe_session_id) {
      console.log(`Attempting to update pending purchase ${latestPurchase.id}`);
      
      // Try to update the purchase status
      const { data: updateData, error: updateError } = await purchasesService.updatePurchaseStatus(
        latestPurchase.stripe_session_id,
        'completed'
      );

      if (updateError) {
        console.error('Error updating purchase status:', updateError);
        
        // Even if there's an error, if the purchase is recent (within last 5 minutes),
        // grant access anyway as the webhook might still be processing
        const purchaseTime = new Date(latestPurchase.created_at).getTime();
        const now = Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;
        
        if (now - purchaseTime < fiveMinutesMs) {
          console.log('Purchase is recent, granting access despite update error');
          return NextResponse.json({
            hasAccess: true,
            purchaseStatus: 'completed',
            purchaseDate: latestPurchase.created_at,
            message: 'Access granted based on recent purchase'
          });
        }
        
        return NextResponse.json({
          hasAccess: false,
          purchaseStatus: 'pending',
          message: 'Purchase is still pending'
        });
      }

      // If the update was successful, return access
      return NextResponse.json({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: latestPurchase.created_at,
        message: 'Purchase status updated to completed'
      });
    }

    // Default response
    return NextResponse.json({
      hasAccess: false,
      purchaseStatus: latestPurchase.status
    });
  } catch (error) {
    console.error('Error in check purchase endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
