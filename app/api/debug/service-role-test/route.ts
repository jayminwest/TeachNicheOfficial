import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';

export async function GET() {
  try {
    // Create a direct client with service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Service role key not found in environment variables',
        hint: 'Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 500 });
    }
    
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
    
    // Try a simple query to check if the service role key works
    // This should work even with an empty database
    const { error } = await supabase.from('lessons').select('count');
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Service role key test failed',
        error: error.message,
        hint: 'Check that SUPABASE_SERVICE_ROLE_KEY is set correctly'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Service role key is working',
      keyPrefix: serviceRoleKey.substring(0, 5) + '...',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Exception during service role test',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
