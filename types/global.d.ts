// Global type definitions for the application
interface Window {
  // For E2E testing
  lastNavigationAttempt?: string | null;
  signInWithGoogle?: () => Promise<any>;
  signInWithGoogleCalled?: boolean;
  mockNextRouter?: boolean;
  nextRouterMock?: {
    push: (url: string) => Promise<boolean>;
  };
  // For mocking user in tests
  mockUser?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      is_creator?: boolean;
    };
  };
}
