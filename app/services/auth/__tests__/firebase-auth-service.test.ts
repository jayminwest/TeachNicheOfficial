import { FirebaseAuthService } from '../firebase-auth-service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn()
}));

describe('FirebaseAuthService', () => {
  let authService: FirebaseAuthService;
  
  beforeEach(() => {
    authService = new FirebaseAuthService();
    vi.clearAllMocks();
  });

  it('should sign in with email/password', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    (signInWithEmailAndPassword as vi.Mock).mockResolvedValue({ user: mockUser });
    
    const result = await authService.signIn('test@example.com', 'password');
    
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      getAuth(),
      'test@example.com',
      'password'
    );
    expect(result).toEqual({
      id: '123',
      email: 'test@example.com',
      emailVerified: false,
      displayName: null
    });
  });

  it('should handle sign-in errors', async () => {
    (signInWithEmailAndPassword as vi.Mock).mockRejectedValue(new Error('Auth failed'));
    
    await expect(authService.signIn('invalid@example.com', 'wrong'))
      .rejects.toThrow('Authentication failed');
  });

  it('should sign up new users', async () => {
    const mockUser = { uid: '456', email: 'new@example.com' };
    (createUserWithEmailAndPassword as vi.Mock).mockResolvedValue({ user: mockUser });
    
    const result = await authService.signUp('new@example.com', 'password', 'New User');
    
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      getAuth(),
      'new@example.com',
      'password'
    );
    expect(updateProfile).toHaveBeenCalledWith(mockUser, {
      displayName: 'New User'
    });
    expect(result.email).toBe('new@example.com');
  });

  it('should sign out users', async () => {
    await authService.signOut();
    expect(signOut).toHaveBeenCalledWith(getAuth());
  });
});
