import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { processScheduledPayouts } from '@/app/services/earnings';

// This endpoint should be secured with a cron secret
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Process payouts
    const results = await processScheduledPayouts(supabase);
    
    return NextResponse.json({
      success: true,
      processed: results.processed,
      failed: results.failed,
      skipped: results.skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Payout processing failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process payouts' },
      { status: 500 }
    );
  }
}
