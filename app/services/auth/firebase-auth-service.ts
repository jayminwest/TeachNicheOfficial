import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { getApp, initializeApp } from 'firebase/app';
import { AuthService, AuthUser } from './interface';
import { auth } from '@/app/lib/firebase';

// Export the interface for use in other files
export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  metadata?: Record<string, unknown>;
}

export class FirebaseAuthService implements AuthService {
  private auth;

  constructor() {
    try {
      // Always use the imported auth instance to ensure consistency
      this.auth = auth;
      
      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';
      
      // Only validate auth in browser environment
      if (isBrowser && !this.auth) {
        console.error('Firebase auth is not initialized');
        throw new Error('Firebase auth is not initialized');
      }
      
      // In server environment, we'll use a placeholder
      if (!isBrowser) {
        console.log('Server-side auth initialization - using placeholder');
      }
    } catch (error) {
      console.error('Error initializing Firebase Auth service:', error);
      // Don't throw in server environment
      if (typeof window !== 'undefined') {
        throw new Error('Failed to initialize Firebase Auth service. Check your Firebase configuration.');
      }
    }
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      await updateProfile(userCredential.user, { displayName: name });
      
      return this.mapFirebaseUserToAuthUser(userCredential.user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      return this.mapFirebaseUserToAuthUser(userCredential.user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        if (user) {
          resolve(this.mapFirebaseUserToAuthUser(user));
        } else {
          resolve(null);
        }
      });
    });
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      if (data.name) {
        updateData.displayName = data.name;
      }
      
      if (data.avatarUrl) {
        updateData.photoURL = data.avatarUrl;
      }
      
      await updateProfile(user, updateData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateEmail(userId: string, email: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      await firebaseUpdateEmail(user, email);
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      await firebaseUpdatePassword(user, password);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  private mapFirebaseUserToAuthUser(user: FirebaseUser): AuthUser {
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      avatarUrl: user.photoURL,
      metadata: {
        createdAt: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };
  }
}

// Helper functions for backward compatibility
export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signInWithGoogle() {
  try {
    // Check if auth is initialized
    if (!auth) {
      console.error('Firebase auth is not initialized');
      throw new Error('Authentication service is not available');
    }
    
    const provider = new GoogleAuthProvider();
    
    // Add scopes for better user info
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
    // Set custom parameters for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log('Starting Google sign-in popup...');
    const userCredential = await signInWithPopup(auth, provider);
    
    console.log('Google sign-in successful');
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const token = credential?.accessToken;
    
    return { 
      user: transformUser(userCredential.user), 
      token,
      error: null 
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error.code, error.message);
    
    // Provide more detailed error information
    if (error.code === 'auth/unauthorized-domain') {
      console.error('This domain is not authorized in Firebase console');
    } else if (error.code === 'auth/internal-error') {
      console.error('Internal Firebase error - check configuration');
    }
    
    return { user: null, token: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getCurrentUser() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('getCurrentUser called in server environment - returning null');
    return null;
  }
  
  if (!auth) {
    console.error('Auth instance is not initialized');
    return null;
  }
  
  return new Promise<AuthUser | null>((resolve) => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user ? transformUser(user) : null);
      }, (error) => {
        console.error('Error in onAuthStateChanged:', error);
        unsubscribe();
        resolve(null);
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      resolve(null);
    }
  });
}

function transformUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    avatarUrl: firebaseUser.photoURL,
    metadata: {
      provider: firebaseUser.providerData[0]?.providerId || 'firebase',
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime
    }
  };
}

const firebaseAuthService = {
  signInWithEmail,
  signUp,
  signInWithGoogle,
  signOut,
  getCurrentUser
};

export default firebaseAuthService;
