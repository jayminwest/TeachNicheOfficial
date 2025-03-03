import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the code from the URL
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Debug information
    console.log('Auth callback received with code:', !!code)
    
    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.redirect(new URL('/?auth_error=no_code', request.url))
    }
    
    // Get cookies in a way that works with Next.js - AWAIT this call
    const cookieStore = await cookies()
    
    // Create a Supabase client for the Route Handler
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=callback_failed', request.url))
    }
    
    if (!data.session) {
      console.error('No session returned from exchangeCodeForSession')
      return NextResponse.redirect(new URL('/auth/signin?error=no_session', request.url))
    }
    
    console.log('Auth successful, redirecting to profile')
    
    // Success - redirect to profile
    return NextResponse.redirect(new URL('/profile', request.url))
  } catch (err) {
    console.error('Exception in auth callback:', err)
    return NextResponse.redirect(new URL('/auth/signin?error=exception', request.url))
  }
}
