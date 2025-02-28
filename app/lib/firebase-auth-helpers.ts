import { auth } from '@/app/lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { cookies } from 'next/headers'

// Function to create a session cookie on the server
export async function createSessionCookie(idToken: string, expiresIn = 60 * 60 * 24 * 5 * 1000) {
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const adminAuth = getAuth()
    
    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    
    // Set cookie options
    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    }
    
    // Set the cookie
    cookies().set(options)
    
    return { success: true }
  } catch (error) {
    console.error('Error creating session cookie:', error)
    return { error: 'Failed to create session' }
  }
}

// Function to sign in and create a session
export async function signInWithSession(email: string, password: string) {
  try {
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Get the ID token
    const idToken = await userCredential.user.getIdToken()
    
    // Create a session cookie (this would be called from an API route)
    return { user: userCredential.user, idToken }
  } catch (error: any) {
    console.error('Error signing in:', error)
    return { error: error.message || 'Failed to sign in' }
  }
}

// Function to sign up and create a session
export async function signUpWithSession(email: string, password: string) {
  try {
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Get the ID token
    const idToken = await userCredential.user.getIdToken()
    
    // Create a session cookie (this would be called from an API route)
    return { user: userCredential.user, idToken }
  } catch (error: any) {
    console.error('Error signing up:', error)
    return { error: error.message || 'Failed to sign up' }
  }
}

// Function to sign out
export async function signOut() {
  try {
    // Sign out from Firebase
    await firebaseSignOut(auth)
    
    // Clear the session cookie
    cookies().delete('__session')
    
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error: 'Failed to sign out' }
  }
}

// Function to get the current session
export async function getSession() {
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const adminAuth = getAuth()
    
    // Get the session cookie
    const sessionCookie = cookies().get('__session')?.value
    
    if (!sessionCookie) {
      return { data: { session: null } }
    }
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    
    // Get the user
    const user = await adminAuth.getUser(decodedClaims.uid)
    
    return {
      data: {
        session: {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: {
              full_name: user.displayName || '',
              avatar_url: user.photoURL || '',
            },
            app_metadata: {
              provider: user.providerData[0]?.providerId || 'password',
              providers: user.providerData.map(p => p.providerId),
            },
          },
          expires_at: decodedClaims.exp,
        }
      }
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return { data: { session: null } }
  }
}
