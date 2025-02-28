/**
 * Auth Provider
 * 
 * This file provides authentication services using Firebase Authentication.
 */

import { app } from '@/app/lib/firebase';
import { AuthService } from './interface';
import { FirebaseAuth } from './firebase-auth';

// Import types only
import type { User as FirebaseUser } from 'firebase/auth';

// Create a server-safe auth provider
const isBrowser = typeof window !== 'undefined';

// Initialize auth lazily only in browser environment
let auth: ReturnType<typeof import('firebase/auth').getAuth> | null = null;
let getAuth: typeof import('firebase/auth').getAuth;
let onAuthStateChanged: typeof import('firebase/auth').onAuthStateChanged;

// Dynamically import Firebase auth in browser only
if (isBrowser) {
  // We'll initialize these in an async function when needed
  import('firebase/auth').then((firebaseAuth) => {
    getAuth = firebaseAuth.getAuth;
    onAuthStateChanged = firebaseAuth.onAuthStateChanged;
    auth = getAuth(app);
  }).catch(error => {
    console.error('Failed to load Firebase auth:', error);
  });
}

// Export a function to get the current user - safe for SSR
export function getCurrentUser() {
  if (!isBrowser || !auth) return null;
  return auth.currentUser;
}

// Export a function to listen for auth state changes - safe for SSR
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  if (!isBrowser || !auth || !onAuthStateChanged) {
    // Return a no-op unsubscribe function for SSR
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Create a class that implements AuthService
class FirebaseAuthService implements AuthService {
  private firebaseAuth: FirebaseAuth;
  
  constructor() {
    this.firebaseAuth = new FirebaseAuth();
  }
  
  async signIn(email: string, password: string): Promise<AuthUser> {
    const user = await this.firebaseAuth.signIn(email, password);
    return this.firebaseAuth.mapToAuthUser(user) as AuthUser;
  }
  
  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    const user = await this.firebaseAuth.signUp(email, password);
    // TODO: Set display name if needed
    return this.firebaseAuth.mapToAuthUser(user) as AuthUser;
  }
  
  async signInWithGoogle(): Promise<AuthUser | null> {
    const user = await this.firebaseAuth.signInWithGoogle();
    return this.firebaseAuth.mapToAuthUser(user);
  }
  
  async signOut(): Promise<void> {
    return this.firebaseAuth.signOut();
  }
  
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return this.firebaseAuth.onAuthStateChanged((user) => {
      callback(this.firebaseAuth.mapToAuthUser(user));
    });
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
    return this.firebaseAuth.mapToAuthUser(this.firebaseAuth.getCurrentUser());
  }
}

export function getAuthService(): AuthService {
  // Always use Firebase auth now that we've migrated
  return new FirebaseAuthService();
}

// Create a singleton instance
const authService = getAuthService();

export default authService;
