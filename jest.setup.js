import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { jest } from '@jest/globals'
import React from 'react'

// Enable new JSX transform
jest.unstable_mockModule('react/jsx-runtime', () => ({
  jsx: jest.fn(),
  jsxs: jest.fn(),
}))

// Set up test environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-firebase-domain.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id'
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket.appspot.com'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id'

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue('mock-id-token')
  };

  return {
    getAuth: jest.fn().mockReturnValue({
      currentUser: mockUser,
      onAuthStateChanged: jest.fn((callback) => {
        callback(mockUser);
        return jest.fn(); // Unsubscribe function
      }),
      signInWithEmailAndPassword: jest.fn().mockResolvedValue({
        user: mockUser
      }),
      createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
        user: mockUser
      }),
      signOut: jest.fn().mockResolvedValue(undefined)
    }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: mockUser
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: mockUser
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn()
  }
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn().mockResolvedValue({
      exists: jest.fn().mockReturnValue(true),
      data: jest.fn().mockReturnValue({ id: 'test-doc-id', name: 'Test Document' })
    }),
    getDocs: jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'test-doc-id',
          data: jest.fn().mockReturnValue({ name: 'Test Document' }),
          exists: jest.fn().mockReturnValue(true)
        }
      ],
      empty: false
    }),
    setDoc: jest.fn().mockResolvedValue(undefined),
    addDoc: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockReturnValue({}),
    where: jest.fn().mockReturnValue({}),
    orderBy: jest.fn().mockReturnValue({}),
    limit: jest.fn().mockReturnValue({})
  };
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn().mockResolvedValue({ ref: {} }),
    getDownloadURL: jest.fn().mockResolvedValue('https://test-storage-url.com/test-file.jpg'),
    deleteObject: jest.fn().mockResolvedValue(undefined)
  };
}));

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn()
};

require('whatwg-fetch')

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
  __esModule: true
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve({
    redirectToCheckout: jest.fn(() => Promise.resolve({ error: null })),
  }),
}))


// Mock MUX
jest.mock('@mux/mux-player-react', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ src, ...props }) => {
    return React.createElement('div', { 'data-testid': 'mux-player', 'data-src': src, ...props });
  })
}));

// Mock MUX Uploader
jest.mock('@mux/mux-uploader-react', () => ({
  __esModule: true,
  MuxUploader: jest.fn().mockImplementation((props) => {
    return React.createElement('div', { 'data-testid': 'mux-uploader', ...props });
  })
}));

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
