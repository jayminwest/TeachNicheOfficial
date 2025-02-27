import { AuthService } from './interface';
import { FirebaseAuth } from './firebase-auth';

export function getAuthService(): AuthService {
  // Always use Firebase auth now that we've migrated
  return new FirebaseAuth();
}

// Create a singleton instance
const authService = getAuthService();

export default authService;
