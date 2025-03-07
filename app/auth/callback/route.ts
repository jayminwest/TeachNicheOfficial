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
    
    if (error) {
      console.error('OAuth error from provider:', error)
      return NextResponse.redirect(new URL('/?auth=signin&error=' + error, request.url))
    }
    
    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.redirect(new URL('/?auth=signin&error=no_code', request.url))
    }
    
    // Create a Supabase client for the Route Handler
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
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
    
    // Get redirect path from cookie or use default
    let redirectTo = '/profile'
    
    // Get redirect path from session storage or use default
    // We'll use a simpler approach that doesn't rely on cookies
    // since they're causing issues in the production environment
    console.log('Auth successful, using default redirect path')
    
    console.log('Auth successful, redirecting to:', redirectTo)
    
    // Success - redirect to the requested page or profile by default
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (err) {
    console.error('Exception in auth callback:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/?auth=signin&error=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
