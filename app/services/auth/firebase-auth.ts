import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { AuthUser } from './interface';

export class FirebaseAuth {
  private auth;

  constructor() {
    const app = getApp();
    this.auth = getAuth(app);
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Error signing in with email/password:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Error signing up with email/password:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    return signOut(this.auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.auth.onAuthStateChanged(callback);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Helper method to convert Firebase User to AuthUser
  mapToAuthUser(user: User | null): AuthUser | null {
    if (!user) return null;
    
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      avatarUrl: user.photoURL,
      metadata: {
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };
  }
}
