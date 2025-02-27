import { FirebaseAuth } from './firebase-auth';

// Use environment variable to determine which implementation to use
const USE_GCP = process.env.NEXT_PUBLIC_USE_GCP === 'true';

export const authService = new FirebaseAuth();

// Re-export the AuthContext components
export { AuthContext, AuthProvider, useAuth } from './AuthContext';
import { SupabaseAuth } from './supabase-auth';
import { FirebaseAuth } from './firebase-auth';

// Use environment variable to determine which implementation to use
const USE_GCP = process.env.NEXT_PUBLIC_USE_GCP === 'true';

export const authService = USE_GCP 
  ? new FirebaseAuth()
  : new SupabaseAuth();
