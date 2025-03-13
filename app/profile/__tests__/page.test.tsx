import { render as testingLibraryRender } from '@testing-library/react'
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

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon">Loading Icon</div>,
}));

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Mock ProfileClient component
jest.mock('../profile-client', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-client">Profile Client Component</div>
}));

// Mock Tabs components
jest.mock('@/app/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }) => (
    <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>
  ),
  TabsList: ({ children }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }) => (
    <button role="tab" data-value={value}>{children}</button>
  ),
  TabsContent: ({ children, value }) => (
    <div role="tabpanel" data-value={value}>{children}</div>
  ),
}));

// Create a helper function instead of mocking
function renderWithAuthContext(ui, authProps = {}) {
  const defaultAuthValues = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Test User' },
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00Z'
    },
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

describe('ProfilePage', () => {
  describe('rendering', () => {
    it('renders loading state initially', async () => {
      // Use direct render with AuthContext
      const { getByText, getByTestId } = testingLibraryRender(
        <AuthContext.Provider value={{ 
          user: null,
          loading: true,
          isAuthenticated: false,
          error: null
        }}>
          <ProfilePage />
        </AuthContext.Provider>
      );
      expect(getByText('Loading...')).toBeInTheDocument();
      expect(getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('redirects unauthenticated users', async () => {
      // Force a re-render with unauthenticated state
      const { getByTestId } = testingLibraryRender(
        <AuthContext.Provider value={{ 
          user: null,
          loading: false, // Not loading
          isAuthenticated: false,
          error: null,
          signIn: jest.fn(),
          signOut: jest.fn(),
          signUp: jest.fn(),
          resetPassword: jest.fn(),
          updateEmail: jest.fn(),
          updatePassword: jest.fn()
        }}>
          <ProfilePage />
        </AuthContext.Provider>
      );
      
      // Verify the router.push was called with the signin URL
      expect(mockPush).toHaveBeenCalledWith('/auth/signin?redirect=/profile');
      
      // Check for the redirect element in test mode
      expect(getByTestId('unauthenticated-redirect')).toBeInTheDocument();
    });

    it('renders profile page for authenticated users', async () => {
      const { getByText } = renderWithAuthContext(<ProfilePage />);
      
      // Check for the profile heading
      expect(getByText('Your Profile')).toBeInTheDocument();
      
      // The ProfileClient component is mocked, so we don't need to check for tabs here
      expect(getByText('Profile Client Component')).toBeInTheDocument();
    });

    it('meets accessibility requirements', async () => {
      const { container } = renderWithAuthContext(<ProfilePage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // We don't need to test tab interactions anymore since we're using the mocked ProfileClient
  // The actual tab interactions should be tested in a separate test file for ProfileClient
});
