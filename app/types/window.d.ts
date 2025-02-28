interface Window {
  /**
   * Flag set when Google sign-in is called
   * Used for testing authentication flows
   */
  signInWithGoogleCalled?: boolean;
  
  /**
   * Mock router for testing navigation
   */
  nextRouterMock?: {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
  };
  
  /**
   * Flag for auth test success
   */
  localStorage: Storage & {
    getItem(key: 'auth-test-success'): string | null;
  };
}
