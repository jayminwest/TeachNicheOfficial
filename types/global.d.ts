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

// For testing Suspense boundaries
declare global {
  namespace NodeJS {
    interface Global {
      __SUSPENSE_TEST_FALLBACK__: boolean;
    }
  }
  var __SUSPENSE_TEST_FALLBACK__: boolean;
}

export {};
