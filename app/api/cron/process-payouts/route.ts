import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { processScheduledPayouts } from '@/app/services/earnings';
import { addRpcToClient } from '@/app/lib/types/supabase-rpc';

// Secret key to secure the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify the request has the correct secret
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.split(' ')[1];
    
    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Process scheduled payouts
    const results = await processScheduledPayouts(supabase);
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error processing scheduled payouts:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to process scheduled payouts'
      },
      { status: 500 }
    );
  }
}

// Also allow GET requests for testing purposes in development
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    );
  }
  
  return POST(request);
}
