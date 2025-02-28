import { getAuth } from 'firebase/auth'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { cookies } from 'next/headers'

// Function to create a session cookie on the server
export async function createSessionCookie(idToken: string, expiresIn = 60 * 60 * 24 * 5 * 1000) {
  try {
    // Import the full firebase-admin package to avoid node: scheme issues
    const admin = await import('firebase-admin')
    const adminAuth = admin.auth()
    
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
    const cookieStore = cookies()
    cookieStore.set(options)
    
    return { success: true }
  } catch (error) {
    console.error('Error creating session cookie:', error)
    return { error: 'Failed to create session' }
  }
}

// Function to sign in and create a session
export async function signInWithSession(email: string, password: string) {
  try {
    const auth = getAuth();
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Get the ID token
    const idToken = await userCredential.user.getIdToken()
    
    // Create a session cookie (this would be called from an API route)
    return { user: userCredential.user, idToken }
  } catch (error: Error | unknown) {
    console.error('Error signing in:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in'
    return { error: errorMessage }
  }
}

// Function to sign up and create a session
export async function signUpWithSession(email: string, password: string) {
  try {
    const auth = getAuth();
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Get the ID token
    const idToken = await userCredential.user.getIdToken()
    
    // Create a session cookie (this would be called from an API route)
    return { user: userCredential.user, idToken }
  } catch (error: Error | unknown) {
    console.error('Error signing up:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign up'
    return { error: errorMessage }
  }
}

// Function to sign out
export async function signOut() {
  try {
    const auth = getAuth();
    // Sign out from Firebase
    await firebaseSignOut(auth)
    
    // Clear the session cookie
    const cookieStore = cookies()
    cookieStore.delete('__session')
    
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error: 'Failed to sign out' }
  }
}

// Function to get the current session
export async function getSession() {
  try {
    // Import the full firebase-admin package to avoid node: scheme issues
    const admin = await import('firebase-admin')
    const adminAuth = admin.auth()
    
    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('__session')?.value
    
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
