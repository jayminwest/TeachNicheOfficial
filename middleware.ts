import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

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
  
  // Create a Supabase client using the middleware helper
  const supabase = createMiddlewareClient({ req, res })
  
  // This is critical for cookie handling - explicitly refresh the session
  await supabase.auth.getSession()
  
  const path = req.nextUrl.pathname
  
  // Check if the request is for a debug route
  if (path.startsWith('/debug') || path.startsWith('/api/debug')) {
    // Only allow access in development environment
    if (process.env.NODE_ENV !== 'development') {
      // Redirect to home page or return 403 for API routes
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Debug endpoints are only available in development environment' },
          { status: 403 }
        );
      } else {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    // In development, allow access to debug routes
    return res;
  }
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(publicPath => path === publicPath) || 
      path.startsWith('/auth/callback') || 
      path.startsWith('/auth/signin') ||
      path.startsWith('/api/auth/verify-config')) {
    return res;
  }
  
  // Get the session using the middleware client
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect dashboard to profile
  if (path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/profile', req.url))
  }
  
  // For unauthenticated users trying to access the profile, redirect to sign in page
  if (path.startsWith('/profile') && !session) {
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('redirect', '/profile')
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/lessons/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/api/:path*', // Protect all API routes by default
    '/auth/callback',
    '/auth/signin',
    '/debug/:path*', // Add debug routes
  ]
}
