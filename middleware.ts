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
  '/api/requests', // Keep requests API accessible
  '/api/auth/verify-config', // Allow auth config verification
  '/api/auth/callback' // Allow auth callback API
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
  
  const path = req.nextUrl.pathname
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(publicPath => path === publicPath) || 
      path.startsWith('/auth/callback') || 
      path.startsWith('/auth/signin') ||
      path.startsWith('/api/auth/verify-config')) {
    console.log('Middleware: Skipping auth check for public path:', path)
    return NextResponse.next()
  }
  
  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
  
  // Get the session from the cookie - try all possible cookie names
  const accessToken = req.cookies.get('sb-access-token')?.value || 
                     req.cookies.get('sb-auth-token')?.value ||
                     req.cookies.get('sb:auth:token')?.value ||
                     req.cookies.get('sb-127-auth-token')?.value
  const refreshToken = req.cookies.get('sb-refresh-token')?.value || 
                      req.cookies.get('sb:auth:refresh_token')?.value ||
                      req.cookies.get('sb-127-refresh-token')?.value || ''
  let session = null
  
  if (accessToken) {
    try {
      console.log('Middleware: Found auth token, attempting to set session')
      // Set the auth cookie for this request
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      // Get the session
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Middleware: Error getting session:', sessionError)
      } else {
        console.log('Middleware: Session retrieved successfully', !!data.session)
        session = data.session
      }
    } catch (error) {
      console.error('Middleware: Exception getting session:', error)
    }
  }

  // Skip middleware for auth routes
  if (path.startsWith('/auth/callback') || path.startsWith('/auth/signin')) {
    return NextResponse.next()
  }

  // Redirect dashboard to profile
  if (path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/profile', req.url))
  }
  
  // For unauthenticated users trying to access the profile, redirect to home page with auth=signin parameter
  // The UI will handle showing the sign-in dialog
  if (path.startsWith('/profile') && !session) {
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('auth', 'signin')
    return NextResponse.redirect(redirectUrl)
  }

  // Check auth restrictions
  const isRestrictedPath = RESTRICTED_PATHS.some(restrictedPath => 
    path.startsWith(restrictedPath)
  )

  if (isRestrictedPath && !session) {
    // Redirect to home page with auth=signin parameter to trigger sign-in dialog
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('auth', 'signin')
    redirectUrl.searchParams.set('redirect', path)
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
    '/auth/signin',
    // Add other paths that need middleware checking
  ]
}
