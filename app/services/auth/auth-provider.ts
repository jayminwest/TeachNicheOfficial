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
let auth: any = null;
let getAuth: Function;
let onAuthStateChanged: Function;

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

export function getAuthService(): AuthService {
  // Always use Firebase auth now that we've migrated
  return new FirebaseAuth();
}

// Create a singleton instance
const authService = getAuthService();

export default authService;
