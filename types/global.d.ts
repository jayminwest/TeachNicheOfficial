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
}
