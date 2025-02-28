// Add TypeScript declarations for custom window properties
interface Window {
  FIREBASE_USE_EMULATORS?: boolean;
}
// Global type definitions for e2e tests
interface Window {
  FIREBASE_USE_EMULATORS?: boolean;
  PLAYWRIGHT_TEST_MODE?: boolean;
  mockGoogleSignInError?: boolean;
  signInWithGoogleCalled?: boolean;
}
