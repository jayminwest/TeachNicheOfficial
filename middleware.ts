import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that should be restricted to authenticated users
const RESTRICTED_PATHS = [
  '/lessons',
  '/profile', 
  '/dashboard',
  '/api/lessons',
  '/api/profile',
  '/api/dashboard',
  '/api/checkout',
  '/api/stripe',
  '/api/video'
]

// Define paths that are work-in-progress and should be blocked for everyone
const WIP_PATHS = [
  '/dashboard/analytics',
  '/lessons/create',
  '/profile/settings'
]

// Define public paths that should always be accessible
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/legal',
  '/requests',
  '/api/requests', // Keep requests API accessible
  '/coming-soon'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // First check if path is WIP - block regardless of auth
  if (WIP_PATHS.some(wipPath => path.startsWith(wipPath))) {
    // Redirect to a "coming soon" page or show an error
    const redirectUrl = new URL('/coming-soon', req.url)
    redirectUrl.searchParams.set('from', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Then check auth restrictions
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
    // Add other paths that need middleware checking
  ]
}
