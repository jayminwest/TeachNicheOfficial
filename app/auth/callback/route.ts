import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        // Redirect to home with error param
        return NextResponse.redirect(
          new URL('/?auth_error=callback_failed', request.url)
        )
      }
      
      // Success - redirect to profile
      return NextResponse.redirect(new URL('/profile', request.url))
    } catch (err) {
      console.error('Exception in auth callback:', err)
      return NextResponse.redirect(
        new URL('/?auth_error=exception', request.url)
      )
    }
  }

  // No code provided - redirect to home
  return NextResponse.redirect(new URL('/?auth_error=no_code', request.url))
}
