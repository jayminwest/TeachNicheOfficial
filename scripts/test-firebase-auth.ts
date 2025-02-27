import { signInWithGoogle, signOut, getCurrentUser } from '../app/services/auth/supabaseAuth';

async function testFirebaseAuth() {
  console.log('Testing Firebase Authentication...');
  
  try {
    console.log('\n--- Testing getCurrentUser ---');
    const initialUser = await getCurrentUser();
    console.log('Initial user:', initialUser);
    
    console.log('\n--- Testing signInWithGoogle (function only) ---');
    console.log('signInWithGoogle function exists:', typeof signInWithGoogle === 'function');
    
    if (initialUser) {
      console.log('\n--- Testing signOut ---');
      await signOut();
      const userAfterSignOut = await getCurrentUser();
      console.log('Sign out successful:', userAfterSignOut === null);
    }
    
    console.log('\nAuth tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testFirebaseAuth();
