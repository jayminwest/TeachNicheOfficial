import { AuthService } from './interface';
import { SupabaseAuth } from './supabase-auth';
import { FirebaseAuth } from './firebase-auth';

export function getAuthService(): AuthService {
  // Check if we should use GCP (Firebase) or Supabase
  const useGCP = process.env.NEXT_PUBLIC_USE_GCP === 'true';
  
  return useGCP ? new FirebaseAuth() : new SupabaseAuth();
}

// Create a singleton instance
const authService = getAuthService();

export default authService;
