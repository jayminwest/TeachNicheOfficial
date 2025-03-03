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
    const state = requestUrl.searchParams.get('state')
    
    // Debug information
    console.log('Auth callback received with code:', !!code)
    console.log('Auth callback state:', !!state)
    console.log('Auth callback error param:', error)
    
    if (error) {
      console.error('OAuth error from provider:', error)
      return NextResponse.redirect(new URL(`/auth/signin?error=${error}`, request.url))
    }
    
    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.redirect(new URL('/auth/signin?error=no_code', request.url))
    }
    
    try {
      // Get cookies in a way that works with Next.js
      const cookieStore = cookies()
      
      // Create a Supabase client for the Route Handler
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Auth callback error:', sessionError)
        
        // Special handling for flow_state_not_found error
        if (sessionError.message?.includes('flow state') || sessionError.code === 'flow_state_not_found') {
          console.log('Flow state error detected, redirecting to sign in page')
          return NextResponse.redirect(new URL('/auth/signin?error=flow_state_expired', request.url))
        }
        
        return NextResponse.redirect(new URL(`/auth/signin?error=callback_failed&message=${encodeURIComponent(sessionError.message)}`, request.url))
      }
      
      if (!data.session) {
        console.error('No session returned from exchangeCodeForSession')
        return NextResponse.redirect(new URL('/auth/signin?error=no_session', request.url))
      }
      
      console.log('Auth successful, redirecting to profile')
      
      // Success - redirect to profile
      return NextResponse.redirect(new URL('/profile', request.url))
    } catch (sessionErr) {
      console.error('Exception in session exchange:', sessionErr)
      
      // If we get a flow state error, redirect to sign in
      if (sessionErr instanceof Error && 
          (sessionErr.message?.includes('flow state') || 
           (sessionErr as any).code === 'flow_state_not_found')) {
        return NextResponse.redirect(new URL('/auth/signin?error=flow_state_expired', request.url))
      }
      
      throw sessionErr // Re-throw to be caught by outer try/catch
    }
  } catch (err) {
    console.error('Exception in auth callback:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/auth/signin?error=exception&message=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
