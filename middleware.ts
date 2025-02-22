import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that should be restricted
const RESTRICTED_PATHS = [
  '/lessons',
  '/profile', 
  '/dashboard'
]

// Define public paths that should always be accessible
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/legal',
  '/requests',
  '/api/requests' // Assuming this is needed for the requests page to function
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Check auth status
  const { data: { session } } = await supabase.auth.getSession()

  // Get the pathname
  const path = req.nextUrl.pathname

  // Check if the path starts with any restricted path
  const isRestrictedPath = RESTRICTED_PATHS.some(restrictedPath => 
    path.startsWith(restrictedPath)
  )

  // If trying to access restricted path without auth, redirect to home
  if (isRestrictedPath && !session) {
    const redirectUrl = new URL('/', req.url)
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
    // Add other paths that need middleware checking
  ]
}
