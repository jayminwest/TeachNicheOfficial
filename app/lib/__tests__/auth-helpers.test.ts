import * as authHelpers from '../auth-helpers';
import * as supabaseAuth from '@/app/services/auth/supabaseAuth';

jest.mock('@/app/services/auth/supabaseAuth', () => {
  const mockModule = {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
  };
  
  // Add default export to match the actual module structure
  mockModule.default = mockModule;
  
  return mockModule;
});

describe('auth-helpers', () => {
  it('should re-export all functions from supabaseAuth', () => {
    // Get keys from both modules, filtering out the default export from authHelpers if needed
    const authHelperKeys = Object.keys(authHelpers).filter(key => key !== 'default');
    const supabaseAuthKeys = Object.keys(supabaseAuth).filter(key => key !== 'default');
    
    // Check that all exported functions match (excluding default)
    expect(authHelperKeys.sort()).toEqual(supabaseAuthKeys.sort());
    
    // Verify each function is the same reference
    authHelperKeys.forEach(key => {
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
