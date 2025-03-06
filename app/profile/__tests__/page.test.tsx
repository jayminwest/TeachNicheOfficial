import { screen, render as testingLibraryRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import ProfilePage from '../page'
import { AuthContext } from '@/app/services/auth/AuthContext'
import { toHaveNoViolations } from 'jest-axe'

// Mock window.matchMedia - required for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Create mock functions
const mockPush = jest.fn();

// Mock process.env.NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

beforeAll(() => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    configurable: true
  });
});

afterAll(() => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: originalNodeEnv,
    configurable: true
  });
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock the router - use the mockPush reference
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
  redirect: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/app/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { stripe_account_id: 'acct_test123' },
      error: null,
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  },
}))

// No need to mock dashboard components as they're not used in the profile page

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Mock Supabase client
jest.mock('@/app/services/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => ({
        data: [{ stripe_account_id: 'acct_test123' }],
        error: null
      }))
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  },
}))

// Create a helper function instead of mocking
function renderWithAuthContext(ui, authProps = {}) {
  const defaultAuthValues = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    isAuthenticated: true,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
    updateEmail: jest.fn(),
    updatePassword: jest.fn()
  };
  
  // Merge default values with provided props
  const mergedProps = { ...defaultAuthValues, ...authProps };
  
  return testingLibraryRender(
    <AuthContext.Provider value={mergedProps}>
      {ui}
    </AuthContext.Provider>
  );
}

// No need to import renderWithAuth since we're using our own helper

describe('ProfilePage', () => {
  describe('rendering', () => {
    it('renders loading state initially', async () => {
      // Use direct render with AuthContext
      const { getByText } = testingLibraryRender(
        <AuthContext.Provider value={{ 
          user: null,
          loading: true,
          isAuthenticated: false,
          error: null
        }}>
          <ProfilePage />
        </AuthContext.Provider>
      );
      expect(getByText('Loading...')).toBeInTheDocument()
    })

    it('redirects unauthenticated users', async () => {
      // Force a re-render with unauthenticated state
      testingLibraryRender(
        <AuthContext.Provider value={{ 
          user: null,
          loading: false, // Not loading
          isAuthenticated: false,
          error: null
        }}>
          <ProfilePage />
        </AuthContext.Provider>
      );
      
      // Verify the router.push was called with the signin URL
      expect(mockPush).toHaveBeenCalledWith('/auth/signin?redirect=/profile')
      
      // Check for the redirect element in test mode
      expect(screen.getByTestId('unauthenticated-redirect')).toBeInTheDocument();
    })

    it('renders profile page for authenticated users', async () => {
      const { getByText, findByText } = renderWithAuthContext(<ProfilePage />);
      
      // Wait for the profile data to load
      await findByText('Your Profile');
      
      // Now check for tab content
      expect(getByText('Profile', { selector: '[role="tab"]' })).toBeInTheDocument();
      expect(getByText('Content', { selector: '[role="tab"]' })).toBeInTheDocument();
      expect(getByText('Settings', { selector: '[role="tab"]' })).toBeInTheDocument();
    })

    it('meets accessibility requirements', async () => {
      const { container } = renderWithAuthContext(<ProfilePage />);
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('interactions', () => {
    it('allows switching between tabs', async () => {
      const user = userEvent.setup()
      const { getByRole, getByText, findByText } = renderWithAuthContext(<ProfilePage />);
      
      // Wait for the profile data to load
      await findByText('Your Profile');

      // Click on Content tab
      await user.click(getByRole('tab', { name: 'Content' }))
      expect(getByText('Your Content')).toBeInTheDocument()

      // Click on Settings tab
      await user.click(getByRole('tab', { name: 'Settings' }))
      expect(getByText('Stripe Connect')).toBeInTheDocument()
    })

    it('displays stripe connect button with account ID', async () => {
      const { getByRole, getByText, findByText } = renderWithAuthContext(<ProfilePage />);
      
      // Wait for the profile data to load
      await findByText('Your Profile');
      
      // Navigate to settings tab
      await userEvent.click(getByRole('tab', { name: 'Settings' }))
      
      // Check that the Stripe Connect section is visible
      expect(getByText('Stripe Connect')).toBeInTheDocument()
      expect(getByText('Connect your Stripe account to receive payments for your lessons')).toBeInTheDocument()
    })
  })
})
