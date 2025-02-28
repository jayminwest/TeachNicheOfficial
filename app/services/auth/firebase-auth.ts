import { getAuth as getFirebaseAuth } from '@/app/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  getAuth as firebaseGetAuth,
  Auth
} from 'firebase/auth';
import { AuthService, AuthUser } from './interface';
import { app } from '@/app/lib/firebase';

// Get auth instance - this is safe in client components
const getAuthInstance = (): Auth => {
  // Try to get auth from our helper function first
  const auth = getFirebaseAuth();
  if (auth) return auth;
  
  // Fallback to creating a new instance if needed
  return firebaseGetAuth(app);
};

export const firebaseAuth = {
  getSession: async () => {
    const auth = getAuthInstance();
    const currentUser = auth.currentUser;
    
    return {
      data: {
        session: currentUser ? {
          user: {
            id: currentUser.uid,
            email: currentUser.email,
            user_metadata: {
              full_name: currentUser.displayName
            }
          }
        } : null
      },
      error: null
    };
  }
};

export class FirebaseAuth implements AuthService {
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const auth = getAuthInstance();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.transformUser(userCredential.user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }
  
  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const auth = getAuthInstance();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with the name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      return this.transformUser(userCredential.user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }
  
  async signOut(): Promise<void> {
    try {
      const auth = getAuthInstance();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
    const auth = getAuthInstance();
    
    // If we already have the current user, return it
    if (auth.currentUser) {
      return this.transformUser(auth.currentUser);
    }
    
    // Otherwise, wait for the auth state to be determined
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user ? this.transformUser(user) : null);
      });
    });
  }
  
  private transformUser(user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    providerData: Array<{ providerId: string }>;
    photoURL: string | null;
  }): AuthUser {
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      avatarUrl: user.photoURL,
      metadata: {
        provider: user.providerData[0]?.providerId || 'password'
      }
    };
  }
}
