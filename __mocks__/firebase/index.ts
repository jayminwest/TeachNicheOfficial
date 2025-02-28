/**
 * Firebase Mock Utilities
 * 
 * This module provides mock implementations of Firebase services for testing.
 * It includes mocks for:
 * - Firebase Authentication
 * - Firestore Database
 * - Firebase Storage
 */

// Mock data
export const mockUserData = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  metadata: {
    creationTime: '2025-01-01T00:00:00Z',
    lastSignInTime: '2025-02-27T00:00:00Z'
  }
};

export const mockLessonData = [
  {
    id: 'lesson-1',
    data: () => ({
      title: 'Test Lesson 1',
      description: 'Test description 1',
      price: 1999,
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      creatorId: 'creator-1',
      averageRating: 4.5,
      totalRatings: 10
    })
  },
  {
    id: 'lesson-2',
    data: () => ({
      title: 'Test Lesson 2',
      description: 'Test description 2',
      price: 2999,
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      creatorId: 'creator-2',
      averageRating: 4.8,
      totalRatings: 15
    })
  }
];

export const mockRequestData = [
  {
    id: 'request-1',
    data: () => ({
      title: 'Test Request 1',
      description: 'Test request description 1',
      category: 'beginner',
      status: 'open',
      userId: 'user-1',
      createdAt: '2025-02-01T00:00:00Z',
      votes: 5
    })
  },
  {
    id: 'request-2',
    data: () => ({
      title: 'Test Request 2',
      description: 'Test request description 2',
      category: 'advanced',
      status: 'in_progress',
      userId: 'user-2',
      createdAt: '2025-02-15T00:00:00Z',
      votes: 10
    })
  }
];

// Firebase Authentication Mocks
export const mockFirebaseAuth = {
  getAuth: () => ({
    currentUser: mockUserData,
    onAuthStateChanged: (callback) => {
      callback(mockUserData);
      return () => {}; // Unsubscribe function
    },
    signInWithEmailAndPassword: () => Promise.resolve({
      user: mockUserData
    }),
    createUserWithEmailAndPassword: () => Promise.resolve({
      user: mockUserData
    }),
    signOut: () => Promise.resolve(undefined),
    sendPasswordResetEmail: () => Promise.resolve(undefined)
  }),
  getSession: () => Promise.resolve({
    data: {
      session: {
        user: mockUserData
      }
    },
    error: null
  })
};

// Firestore Mocks
export const mockFirestore = {
  getFirestore: () => ({}),
  collection: () => ({}),
  doc: () => ({}),
  getDoc: () => Promise.resolve({
    exists: () => true,
    data: () => mockUserData
  }),
  getDocs: () => Promise.resolve({
    docs: mockLessonData,
    empty: false
  }),
  query: () => ({}),
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  startAfter: () => ({}),
  addDoc: () => Promise.resolve({ id: 'new-doc-id' }),
  setDoc: () => Promise.resolve(undefined),
  updateDoc: () => Promise.resolve(undefined),
  deleteDoc: () => Promise.resolve(undefined),
  serverTimestamp: () => '2025-02-27T00:00:00Z'
};

// Firebase Storage Mocks
export const mockStorage = {
  getStorage: () => ({}),
  ref: () => ({}),
  uploadBytes: () => Promise.resolve({
    ref: {
      fullPath: 'uploads/test-file.jpg'
    }
  }),
  uploadString: () => Promise.resolve({
    ref: {
      fullPath: 'uploads/test-file.jpg'
    }
  }),
  getDownloadURL: () => Promise.resolve('https://example.com/download-url'),
  deleteObject: () => Promise.resolve(undefined)
};

// Pre-configured mock functions for use in tests
export const mockAuthFunctions = {
  getSession: () => Promise.resolve({
    data: {
      session: {
        user: mockUserData
      }
    },
    error: null
  }),
  signIn: () => Promise.resolve(mockUserData),
  signUp: () => Promise.resolve(mockUserData),
  signOut: () => Promise.resolve(undefined),
  resetPassword: () => Promise.resolve(undefined)
};

// Helper function for documentation purposes
export function setupFirebaseMocks() {
  console.warn(
    'setupFirebaseMocks() should not be called directly in tests. ' +
    'Instead, mock the modules in your test file using the mock objects exported from this file.'
  );
}

// Helper to create custom mock responses
export function createMockQuerySnapshot(data: any[]) {
  return {
    docs: data.map(item => ({
      id: item.id || `doc-${Math.random().toString(36).substring(2, 9)}`,
      data: () => (item.data ? item.data() : item)
    })),
    empty: data.length === 0
  };
}

// Export mock implementation factories for use in jest.mock
export const mockFirebaseAuthModule = () => mockFirebaseAuth;
export const mockFirestoreModule = () => mockFirestore;
export const mockStorageModule = () => mockStorage;
