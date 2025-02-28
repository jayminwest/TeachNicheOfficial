import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { getApp } from 'firebase/app';

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

  async signOut(): Promise<void> {
    return signOut(this.auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.auth.onAuthStateChanged(callback);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
