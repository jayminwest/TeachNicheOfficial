import { FirebaseAuthService } from '../firebase-auth-service';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn()
}));

describe('FirebaseAuthService', () => {
  let authService: FirebaseAuthService;
  
  beforeEach(() => {
    authService = new FirebaseAuthService();
    jest.clearAllMocks();
  });

  it('should sign in with email/password', async () => {
    const mockUser = { uid: '123', email: 'test@example.com', metadata: { creationTime: '2023-01-01', lastSignInTime: '2023-01-02' } };
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });
    
    const result = await authService.signIn('test@example.com', 'password');
    
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      getAuth(),
      'test@example.com',
      'password'
    );
    expect(result.id).toBe('123');
    expect(result.email).toBe('test@example.com');
  });

  it('should handle sign-in errors', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Authentication failed'));
    
    await expect(authService.signIn('invalid@example.com', 'wrong'))
      .rejects.toThrow('Authentication failed');
  });

  it('should sign up new users', async () => {
    const mockUser = { uid: '456', email: 'new@example.com', metadata: { creationTime: '2023-01-01', lastSignInTime: '2023-01-02' } };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });
    
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
