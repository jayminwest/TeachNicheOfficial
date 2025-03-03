import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that should be restricted to authenticated users
const RESTRICTED_PATHS: string[] = [
  '/lessons/create',
  '/profile',
  '/dashboard', 
  '/api/checkout',
  '/api/stripe',
  '/api/video'
]

// Define public paths that should always be accessible
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/legal',
  '/requests',
  '/auth/callback', // Allow auth callback
  '/api/requests' // Keep requests API accessible
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Get auth cookie from request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    return res
  }
  
  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
  
  // Get the session from the cookie
  const authCookie = req.cookies.get('sb-auth-token')?.value
  let session = null
  
  if (authCookie) {
    try {
      // Set the auth cookie for this request
      supabase.auth.setSession({
        access_token: authCookie,
        refresh_token: ''
      })
      
      // Get the session
      const { data } = await supabase.auth.getSession()
      session = data.session
    } catch (error) {
      console.error('Error getting session:', error)
    }
  }
  
  const path = req.nextUrl.pathname

  // Skip middleware for auth callback route
  if (path.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // Redirect dashboard to profile
  if (path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/profile', req.url))
  }

  // Check auth restrictions
  const isRestrictedPath = RESTRICTED_PATHS.some(restrictedPath => 
    path.startsWith(restrictedPath)
  )

  if (isRestrictedPath && !session) {
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('auth_required', 'true')
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/lessons/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/api/:path*', // Protect all API routes by default
    '/auth/callback',
    // Add other paths that need middleware checking
  ]
}
