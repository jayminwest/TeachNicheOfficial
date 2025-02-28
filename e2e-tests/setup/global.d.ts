// Global type definitions for e2e tests
interface Window {
  FIREBASE_USE_EMULATORS?: boolean;
  PLAYWRIGHT_TEST_MODE?: boolean;
  mockGoogleSignInError?: boolean;
  signInWithGoogleCalled?: boolean;
  lastNavigationAttempt?: string | null;
  signInWithGoogle?: () => Promise<any>;
  mockNextRouter?: boolean;
  nextRouterMock?: {
    push: (url: string) => Promise<boolean>;
  };
}
