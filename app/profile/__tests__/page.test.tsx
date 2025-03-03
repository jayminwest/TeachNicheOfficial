import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import ProfilePage from '../page'
import { render } from '@testing-library/react'
import { AuthContext } from '@/app/services/auth/AuthContext'
import { toHaveNoViolations } from 'jest-axe'

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

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Create a helper function instead of mocking
function renderWithAuthContext(ui, authProps = {}) {
  const defaultAuthValues = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    isAuthenticated: true,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    resetPassword: jest.fn(),
    updateEmail: jest.fn(),
    updatePassword: jest.fn()
  };
  
  // Merge default values with provided props
  const mergedProps = { ...defaultAuthValues, ...authProps };
  
  return render(
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
      const { getByText } = render(
        <AuthContext.Provider value={{ 
          user: null,
          loading: true,
          isAuthenticated: false
        }}>
          <ProfilePage />
        </AuthContext.Provider>
      );
      expect(getByText('Loading...')).toBeInTheDocument()
    })

    it('redirects unauthenticated users', async () => {
      // Force a re-render with unauthenticated state
      render(
        <AuthContext.Provider value={{ 
          user: null,
          loading: false, // Not loading
          isAuthenticated: false
        }}>
          <ProfilePage />
        </AuthContext.Provider>
      );
      
      // Verify the router.push was called
      expect(mockPush).toHaveBeenCalledWith('/')
      
      // Check for the redirect element in test mode
      expect(screen.getByTestId('unauthenticated-redirect')).toBeInTheDocument();
    })

    it('renders profile page for authenticated users', async () => {
      const { getByText } = renderWithAuthContext(<ProfilePage />);
      expect(getByText('Profile')).toBeInTheDocument()
      expect(getByText('Content')).toBeInTheDocument()
      expect(getByText('Settings')).toBeInTheDocument()
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
      const { getByRole, getByText } = renderWithAuthContext(<ProfilePage />);

      // Click on Content tab
      await user.click(getByRole('tab', { name: 'Content' }))
      expect(getByText('Create New Lesson')).toBeInTheDocument()

      // Click on Settings tab
      await user.click(getByRole('tab', { name: 'Settings' }))
      expect(getByText('Stripe Connect')).toBeInTheDocument()
    })

    it('displays stripe connect button with account ID', async () => {
      const { getByRole, getByText } = renderWithAuthContext(<ProfilePage />);
      
      // Navigate to settings tab
      await userEvent.click(getByRole('tab', { name: 'Settings' }))
      
      // Check that the Stripe Connect section is visible
      expect(getByText('Stripe Connect')).toBeInTheDocument()
      expect(getByText('Connect your Stripe account to receive payments for your lessons')).toBeInTheDocument()
    })
  })
})
