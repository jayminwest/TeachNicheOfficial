import { FirebaseAuth } from './firebase-auth';

// Create and export the auth service
export const authService = new FirebaseAuth();

// Export a function to get the current user for backward compatibility
export const getCurrentUser = async () => {
  return await authService.getCurrentUser();
};

// Re-export the AuthContext components
export { AuthContext, AuthProvider, useAuth } from './AuthContext';
