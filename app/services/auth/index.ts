import { FirebaseAuth } from './firebase-auth';

// Create and export the auth service
export const authService = new FirebaseAuth();

// Re-export the AuthContext components
export { AuthContext, AuthProvider, useAuth } from './AuthContext';
