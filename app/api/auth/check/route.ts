import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    // Try both authentication methods for better compatibility
    let authInfo = { authenticated: false, userId: null, method: null };
    
    // Method 1: Using createServerSupabaseClient
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      authInfo = { 
        authenticated: true, 
        userId: session.user.id,
        method: 'serverSupabaseClient'
      };
    } else {
      // Method 2: Using createRouteHandlerClient
      const routeClient = createRouteHandlerClient({ cookies });
      const { data: { session: routeSession } } = await routeClient.auth.getSession();
      
      if (routeSession) {
        authInfo = { 
          authenticated: true, 
          userId: routeSession.user.id,
          method: 'routeHandlerClient'
        };
      }
    }
    
    return NextResponse.json(authInfo);
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
