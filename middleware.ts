import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that should be restricted to authenticated users
const RESTRICTED_PATHS: string[] = [
  '/lessons/create',
  '/profile/settings',
  '/dashboard/analytics', 
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
  '/api/requests' // Keep requests API accessible
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname
  
  // Get the session cookie
  const sessionCookie = req.cookies.get('__session')?.value
  let session = null
  
  if (sessionCookie) {
    try {
      // Call our auth verification API instead of using firebase-admin directly
      // This avoids Edge Runtime limitations with dynamic code evaluation
      const verifyResponse = await fetch(new URL('/api/auth/verify-session', req.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionCookie }),
      })
      
      if (verifyResponse.ok) {
        const userData = await verifyResponse.json()
        
        // Set user info in session
        session = {
          user: {
            id: userData.uid,
            email: userData.email || '',
          }
        }
        
        // You can add the user to the request headers if needed
        res.headers.set('X-User-ID', userData.uid)
      } else {
        // Invalid session cookie
        res.cookies.delete('__session')
      }
    } catch (error) {
      // Error verifying session
      console.error('Error verifying session:', error)
      
      // Optionally clear the invalid cookie
      res.cookies.delete('__session')
    }
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
    // Add other paths that need middleware checking
  ]
}
