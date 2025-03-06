import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the code from the URL
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const redirectTo = requestUrl.searchParams.get('redirect_to') || '/profile'
    
    if (error) {
      console.error('OAuth error from provider:', error)
      return NextResponse.redirect(new URL('/?auth=signin&error=' + error, request.url))
    }
    
    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.redirect(new URL('/?auth=signin&error=no_code', request.url))
    }
    
    // Get cookies in a way that works with Next.js
    const cookieStore = await cookies()
    
    // Create a Supabase client for the Route Handler
    // In Next.js 15, cookies() returns a Promise, so we need to use an async function
    const supabase = createRouteHandlerClient({ 
      cookies: () => Promise.resolve(cookieStore) 
    })
    
    // Exchange the code for a session
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Auth callback error:', sessionError)
      return NextResponse.redirect(new URL(`/?auth=signin&error=${encodeURIComponent(sessionError.message)}`, request.url))
    }
    
    if (!data.session) {
      console.error('No session returned from exchangeCodeForSession')
      return NextResponse.redirect(new URL('/?auth=signin&error=no_session', request.url))
    }
    
    console.log('Auth successful, redirecting to:', redirectTo)
    
    // Success - redirect to the requested page or profile by default
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (err) {
    console.error('Exception in auth callback:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/?auth=signin&error=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
