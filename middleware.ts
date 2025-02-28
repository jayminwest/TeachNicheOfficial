import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth'

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

// Initialize Firebase Admin if not already initialized
let firebaseAdminInitialized = false
const initializeFirebaseAdmin = async () => {
  if (!firebaseAdminInitialized) {
    const { initializeApp, cert } = await import('firebase-admin/app')
    
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
      firebaseAdminInitialized = true
    } catch (error: any) {
      // App might already be initialized
      if (!/already exists/i.test(error.message)) {
        console.error('Firebase admin initialization error', error)
      }
    }
  }
  return getAuth()
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname
  
  // Get the session cookie
  const sessionCookie = req.cookies.get('__session')?.value
  let session = null
  
  if (sessionCookie) {
    try {
      // Initialize Firebase Admin
      const adminAuth = await initializeFirebaseAdmin()
      
      // Verify the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
      
      // Set user info in session
      session = {
        user: {
          id: decodedClaims.uid,
          email: decodedClaims.email || '',
        }
      }
      
      // You can add the user to the request headers if needed
      res.headers.set('X-User-ID', decodedClaims.uid)
    } catch (error) {
      // Invalid session cookie
      console.error('Error verifying session cookie:', error)
      
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
