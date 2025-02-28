/**
 * Firebase Mock Utilities
 * 
 * This module provides mock implementations of Firebase services for testing.
 * It includes mocks for:
 * - Firebase Authentication
 * - Firestore Database
 * - Firebase Storage
 */

import { jest } from '@jest/globals';

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
  getAuth: jest.fn().mockReturnValue({
    currentUser: mockUserData,
    onAuthStateChanged: jest.fn(callback => {
      callback(mockUserData);
      return jest.fn(); // Unsubscribe function
    }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: mockUserData
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: mockUserData
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
  }),
  getSession: jest.fn().mockResolvedValue({
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
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  getDoc: jest.fn().mockResolvedValue({
    exists: jest.fn().mockReturnValue(true),
    data: jest.fn().mockReturnValue(mockUserData)
  }),
  getDocs: jest.fn().mockResolvedValue({
    docs: mockLessonData,
    empty: false
  }),
  query: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  startAfter: jest.fn().mockReturnThis(),
  addDoc: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn().mockReturnValue('2025-02-27T00:00:00Z')
};

// Firebase Storage Mocks
export const mockStorage = {
  getStorage: jest.fn(),
  ref: jest.fn().mockReturnThis(),
  uploadBytes: jest.fn().mockResolvedValue({
    ref: {
      fullPath: 'uploads/test-file.jpg'
    }
  }),
  uploadString: jest.fn().mockResolvedValue({
    ref: {
      fullPath: 'uploads/test-file.jpg'
    }
  }),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/download-url'),
  deleteObject: jest.fn().mockResolvedValue(undefined)
};

// Helper function to setup all Firebase mocks
export function setupFirebaseMocks() {
  // Auth mocks
  jest.mock('firebase/auth', () => mockFirebaseAuth);
  jest.mock('@/app/services/auth/firebase-auth', () => ({
    firebaseAuth: {
      getSession: mockFirebaseAuth.getSession,
      signIn: jest.fn().mockResolvedValue(mockUserData),
      signUp: jest.fn().mockResolvedValue(mockUserData),
      signOut: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined)
    }
  }));

  // Firestore mocks
  jest.mock('firebase/firestore', () => mockFirestore);
  
  // Storage mocks
  jest.mock('firebase/storage', () => mockStorage);
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
