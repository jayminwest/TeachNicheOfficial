/**
 * Test Firebase Authentication
 * 
 * This script tests the Firebase authentication service to ensure it works correctly.
 */

import { getAuth, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { app } from '../app/lib/firebase.js';

// Initialize Firebase Auth
const auth = getAuth(app);

// Get the current user
async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Sign out the current user
async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

async function testFirebaseAuth() {
  console.log('Testing Firebase Authentication...');
  
  try {
    // Test getting current user (should be null if not signed in)
    console.log('\n--- Testing getCurrentUser ---');
    const initialUser = await getCurrentUser();
    console.log('Initial user:', initialUser);
    
    // If already signed in, test sign out
    if (initialUser) {
      console.log('\n--- Testing signOut ---');
      await signOut();
      const userAfterSignOut = await getCurrentUser();
      console.log('User after sign out:', userAfterSignOut);
      console.log('Sign out successful:', userAfterSignOut === null);
    }
    
    console.log('\nAuth tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testFirebaseAuth();
