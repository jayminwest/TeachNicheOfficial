import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/PurchasesService';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { lessonId, sessionId } = body;

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

    // If a session ID was provided, verify it directly with Stripe
    if (sessionId) {
      console.log(`Verifying session ID directly with Stripe: ${sessionId}`);
      const { data: stripeVerification, error: stripeError } = await purchasesService.verifyStripeSession(sessionId);
      
      if (stripeError) {
        console.error('Error verifying with Stripe:', stripeError);
      } else {
        console.log('Stripe verification result:', stripeVerification);
      }
      
      if (!stripeError && stripeVerification?.isPaid) {
        console.log('Stripe verification confirms payment is complete');
        // If Stripe says it's paid, create or update the purchase record
        const createResult = await purchasesService.createPurchase({
          lessonId,
          userId,
          amount: stripeVerification.amount,
          stripeSessionId: sessionId,
          fromWebhook: false
        });
        
        if (createResult.error) {
          console.error('Error creating purchase from verification:', createResult.error);
        } else {
          console.log(`Created/updated purchase record: ${createResult.data?.id}`);
        }
        
        return NextResponse.json({
          hasAccess: true,
          purchaseStatus: 'completed',
          purchaseDate: new Date().toISOString(),
          message: 'Access granted based on Stripe verification'
        });
      }
    }

    // If no session ID or verification failed, check for pending purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, stripe_session_id, status, created_at')
      .eq('lesson_id', lessonId)
      .filter('user_id', 'eq', userId)
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
    
    // Make sure latestPurchase has the expected properties
    if (!latestPurchase || typeof latestPurchase !== 'object') {
      console.error('Invalid purchase record:', latestPurchase);
      return NextResponse.json({
        hasAccess: false,
        purchaseStatus: 'none',
        error: 'Invalid purchase record'
      });
    }

    // If the purchase is already completed, return access
    if (latestPurchase.status === 'completed') {
      return NextResponse.json({
        hasAccess: true,
        purchaseStatus: 'completed',
        purchaseDate: latestPurchase.created_at
      });
    }

    // If the purchase is pending and has a session ID, verify with Stripe
    if (latestPurchase.status === 'pending' && latestPurchase.stripe_session_id) {
      console.log(`Attempting to verify pending purchase ${latestPurchase.id}`);
      
      // First try to verify with Stripe directly
      const { data: stripeVerification, error: stripeError } = 
        await purchasesService.verifyStripeSession(latestPurchase.stripe_session_id);
      
      if (!stripeError && stripeVerification?.isPaid) {
        // Update the purchase status
        await purchasesService.updatePurchaseStatus(
          latestPurchase.stripe_session_id,
          'completed'
        );
        
        return NextResponse.json({
          hasAccess: true,
          purchaseStatus: 'completed',
          purchaseDate: latestPurchase.created_at,
          message: 'Purchase status updated to completed based on Stripe verification'
        });
      }
      
      // If Stripe verification failed, try the regular update
      const { error: updateError } = await purchasesService.updatePurchaseStatus(
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
