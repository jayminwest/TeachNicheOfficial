import { auth } from '@/app/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { AuthService, AuthUser } from './interface';

export class FirebaseAuth implements AuthService {
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.transformUser(userCredential.user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }
  
  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    try {
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
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
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
  
  private transformUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url
    };
  }
}
