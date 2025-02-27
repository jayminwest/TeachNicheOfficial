/**
 * Auth Provider
 * 
 * This file provides authentication services using Firebase Authentication.
 */

import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/app/lib/firebase';
import { AuthService } from './interface';
import { FirebaseAuth } from './firebase-auth';

// Initialize Firebase Auth
const auth = getAuth(app);

// Export the auth instance for use in other files
export { auth };

// Export a function to get the current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Export a function to listen for auth state changes
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getAuthService(): AuthService {
  // Always use Firebase auth now that we've migrated
  return new FirebaseAuth();
}

// Create a singleton instance
const authService = getAuthService();

export default authService;
