/**
 * Test Firebase Authentication
 * 
 * This script tests the Firebase authentication service to ensure it works correctly.
 */

import { signInWithGoogle, signOut, getCurrentUser } from '../app/services/auth/supabaseAuth';

async function testFirebaseAuth() {
  console.log('Testing Firebase Authentication...');
  
  try {
    // Test getting current user (should be null if not signed in)
    console.log('\n--- Testing getCurrentUser ---');
    const initialUser = await getCurrentUser();
    console.log('Initial user:', initialUser);
    
    // Note: We can't fully test sign-in with Google in a script
    // as it requires a browser popup, but we can test the function exists
    console.log('\n--- Testing signInWithGoogle (function only) ---');
    console.log('signInWithGoogle function exists:', typeof signInWithGoogle === 'function');
    
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
