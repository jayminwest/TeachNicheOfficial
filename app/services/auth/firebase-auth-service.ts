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
import { getApp } from 'firebase/app';
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
    const app = getApp();
    this.auth = getAuth(app);
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
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const token = credential?.accessToken;
    return { 
      user: transformUser(userCredential.user), 
      token,
      error: null 
    };
  } catch (error) {
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
  return new Promise<AuthUser | null>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user ? transformUser(user) : null);
    });
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
