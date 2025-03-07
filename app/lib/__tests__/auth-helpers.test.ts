import * as authHelpers from '../auth-helpers';
import * as supabaseAuth from '@/app/services/auth/supabaseAuth';

jest.mock('@/app/services/auth/supabaseAuth', () => ({
  getSession: jest.fn(),
  getUser: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
}));

describe('auth-helpers', () => {
  it('should re-export all functions from supabaseAuth', () => {
    // Check that all exported functions from auth-helpers match supabaseAuth
    expect(Object.keys(authHelpers)).toEqual(Object.keys(supabaseAuth));
    
    // Verify each function is the same reference
    Object.keys(authHelpers).forEach(key => {
      expect((authHelpers as any)[key]).toBe((supabaseAuth as any)[key]);
    });
  });

  it('should maintain function references when called', () => {
    // Setup mock return values
    (supabaseAuth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
    (supabaseAuth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
    
    // Call the re-exported functions
    authHelpers.getSession();
    authHelpers.getUser();
    
    // Verify the original functions were called
    expect(supabaseAuth.getSession).toHaveBeenCalled();
    expect(supabaseAuth.getUser).toHaveBeenCalled();
  });
});
