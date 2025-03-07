import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Try a simple query that should work with service role
    const { data, error } = await supabase.from('lessons').select('count').limit(1);
    
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
      version: data
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Exception during service role test',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
