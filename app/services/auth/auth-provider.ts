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
  
  async signIn(_email: string, _password: string): Promise<unknown> {
    // Implement signIn method
    console.warn('signIn not implemented');
    return null;
  }
  
  async signUp(_email: string, _password: string): Promise<unknown> {
    // Implement signUp method
    console.warn('signUp not implemented');
    return null;
  }
  
  // Delegate other methods to FirebaseAuth
  async signInWithGoogle() {
    return this.firebaseAuth.signInWithGoogle();
  }
  
  async signOut() {
    return this.firebaseAuth.signOut();
  }
  
  onAuthStateChanged(callback: (user: unknown) => void) {
    return this.firebaseAuth.onAuthStateChanged(callback);
  }
  
  get currentUser() {
    return this.firebaseAuth.currentUser;
  }
}

export function getAuthService(): AuthService {
  // Always use Firebase auth now that we've migrated
  return new FirebaseAuthService();
}

// Create a singleton instance
const authService = getAuthService();

export default authService;
