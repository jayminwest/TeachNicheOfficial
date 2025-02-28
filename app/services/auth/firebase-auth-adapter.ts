import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  browserPopupRedirectResolver,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { auth } from '@/app/services/firebase';
import { AuthUser } from './interface';

// Ensure auth is properly typed
const firebaseAuth: Auth = auth as Auth;

export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    const provider = new GoogleAuthProvider();
    // Use browserPopupRedirectResolver to fix the "requested action is invalid" error
    const result = await signInWithPopup(firebaseAuth, provider, browserPopupRedirectResolver);
    
    // Get user information
    const user = result.user;
    
    return mapFirebaseUserToAuthUser(user);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  try {
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const user = result.user;
    
    return mapFirebaseUserToAuthUser(user);
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createUser(email: string, password: string): Promise<AuthUser> {
  try {
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = result.user;
    
    return mapFirebaseUserToAuthUser(user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(firebaseAuth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getCurrentUser(): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
      resolve(null);
      return;
    }
    
    resolve(mapFirebaseUserToAuthUser(user));
  });
}

/**
 * Helper function to map Firebase User to AuthUser
 */
function mapFirebaseUserToAuthUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || '',
    avatarUrl: user.photoURL || '',
    metadata: {
      createdAt: user.metadata?.creationTime || '',
      lastSignInTime: user.metadata?.lastSignInTime || '',
      provider: user.providerData?.[0]?.providerId || 'firebase',
      emailVerified: user.emailVerified || false
    }
  };
}
