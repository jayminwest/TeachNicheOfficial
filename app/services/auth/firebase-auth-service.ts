import { AuthService, AuthUser } from './interface';
import type { 
  User as FirebaseUser,
  UserCredential,
  Auth
} from 'firebase/auth';

// Flag to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Dynamically import auth-related modules only on the client side
const getFirebaseAuth = async (): Promise<{
  auth: Auth | null;
  createUserWithEmailAndPassword: Function;
  signInWithEmailAndPassword: Function;
  signOut: Function;
  sendPasswordResetEmail: Function;
  updateProfile: Function;
  updateEmail: Function;
  updatePassword: Function;
  onAuthStateChanged: Function;
  signInWithPopup: Function;
  GoogleAuthProvider: any;
}> => {
  if (!isBrowser) {
    return {
      auth: null,
      createUserWithEmailAndPassword: () => Promise.reject(new Error('Not available on server')),
      signInWithEmailAndPassword: () => Promise.reject(new Error('Not available on server')),
      signOut: () => Promise.reject(new Error('Not available on server')),
      sendPasswordResetEmail: () => Promise.reject(new Error('Not available on server')),
      updateProfile: () => Promise.reject(new Error('Not available on server')),
      updateEmail: () => Promise.reject(new Error('Not available on server')),
      updatePassword: () => Promise.reject(new Error('Not available on server')),
      onAuthStateChanged: () => () => {}, // Return a no-op unsubscribe function
      signInWithPopup: () => Promise.reject(new Error('Not available on server')),
      GoogleAuthProvider: class MockGoogleAuthProvider {
        static credentialFromResult() { return null; }
        addScope() { return this; }
        setCustomParameters() { return this; }
      }
    };
  }

  try {
    // Import Firebase modules dynamically
    const firebaseAuth = await import('firebase/auth');
    const { getAuth } = firebaseAuth;
    
    // Import Firebase app
    const { app } = await import('@/app/lib/firebase');
    
    // Get auth instance
    const auth = getAuth(app);
    
    return {
      auth,
      createUserWithEmailAndPassword: firebaseAuth.createUserWithEmailAndPassword,
      signInWithEmailAndPassword: firebaseAuth.signInWithEmailAndPassword,
      signOut: firebaseAuth.signOut,
      sendPasswordResetEmail: firebaseAuth.sendPasswordResetEmail,
      updateProfile: firebaseAuth.updateProfile,
      updateEmail: firebaseAuth.updateEmail,
      updatePassword: firebaseAuth.updatePassword,
      onAuthStateChanged: firebaseAuth.onAuthStateChanged,
      signInWithPopup: firebaseAuth.signInWithPopup,
      GoogleAuthProvider: firebaseAuth.GoogleAuthProvider
    };
  } catch (error) {
    console.error('Error loading Firebase auth:', error);
    return {
      auth: null,
      createUserWithEmailAndPassword: () => Promise.reject(error),
      signInWithEmailAndPassword: () => Promise.reject(error),
      signOut: () => Promise.reject(error),
      sendPasswordResetEmail: () => Promise.reject(error),
      updateProfile: () => Promise.reject(error),
      updateEmail: () => Promise.reject(error),
      updatePassword: () => Promise.reject(error),
      onAuthStateChanged: () => () => {}, // Return a no-op unsubscribe function
      signInWithPopup: () => Promise.reject(error),
      GoogleAuthProvider: class MockGoogleAuthProvider {
        static credentialFromResult() { return null; }
        addScope() { return this; }
        setCustomParameters() { return this; }
      }
    };
  }
};

export class FirebaseAuthService implements AuthService {
  private authPromise: Promise<Auth | null>;

  constructor() {
    // Initialize auth lazily
    this.authPromise = this.initializeAuth();
  }

  private async initializeAuth(): Promise<Auth | null> {
    try {
      const { auth } = await getFirebaseAuth();
      return auth;
    } catch (error) {
      console.error('Error initializing Firebase Auth service:', error);
      return null;
    }
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const { auth, createUserWithEmailAndPassword, updateProfile } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
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
      const { auth, signInWithEmailAndPassword } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth, 
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
      const { auth, signOut } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { auth, onAuthStateChanged } = await getFirebaseAuth();
      
      if (!auth) {
        console.error('Firebase auth is not initialized');
        return null;
      }
      
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          if (user) {
            resolve(this.mapFirebaseUserToAuthUser(user));
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }): Promise<void> {
    try {
      const { auth, updateProfile } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      const user = auth.currentUser;
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
      const { auth, updateEmail } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      await updateEmail(user, email);
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    try {
      const { auth, updatePassword } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      await updatePassword(user, password);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const { auth, sendPasswordResetEmail } = await getFirebaseAuth();
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      
      await sendPasswordResetEmail(auth, email);
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
    const { auth, signInWithEmailAndPassword } = await getFirebaseAuth();
    if (!auth) throw new Error('Auth not initialized');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const { auth, createUserWithEmailAndPassword } = await getFirebaseAuth();
    if (!auth) throw new Error('Auth not initialized');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const { auth, createUserWithEmailAndPassword, updateProfile } = await getFirebaseAuth();
    if (!auth) throw new Error('Auth not initialized');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signInWithGoogle() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Google sign-in is not available on the server');
    }
    
    const { 
      auth, 
      signInWithPopup, 
      GoogleAuthProvider 
    } = await getFirebaseAuth();
    
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
    
    const userCredential = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const token = credential?.accessToken;
    
    return { 
      user: transformUser(userCredential.user), 
      token,
      error: null 
    };
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    // Provide more detailed error information for logging
    if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/internal-error') {
      // These errors require configuration changes
    }
    
    return { user: null, token: null, error };
  }
}

export async function signOut() {
  try {
    const { auth, signOut: firebaseSignOut } = await getFirebaseAuth();
    if (!auth) throw new Error('Auth not initialized');
    
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('getCurrentUser called in server environment - returning null');
    return null;
  }
  
  try {
    const { auth, onAuthStateChanged } = await getFirebaseAuth();
    
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
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

function transformUser(firebaseUser: any): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    avatarUrl: firebaseUser.photoURL,
    metadata: {
      provider: firebaseUser.providerData?.[0]?.providerId || 'firebase',
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata?.creationTime,
      lastSignInTime: firebaseUser.metadata?.lastSignInTime
    }
  };
}

// For testing environment
if (process.env.NODE_ENV === 'test') {
  // Mock implementations for testing
  // @ts-expect-error - for testing purposes
  signInWithGoogle = jest.fn().mockImplementation(async () => {
    return { 
      user: { 
        id: 'test-user-id', 
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null
      }, 
      token: 'test-token',
      error: null 
    };
  });
}

const firebaseAuthService = {
  signInWithEmail,
  signUp,
  signInWithGoogle,
  signOut,
  getCurrentUser
};

export default firebaseAuthService;
