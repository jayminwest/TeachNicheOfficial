import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, browserPopupRedirectResolver } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Add these settings to help with authentication issues
  popupRedirectResolver: browserPopupRedirectResolver
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
// Initialize auth with proper settings
const auth = getAuth(app);
// Set persistence to local to avoid session issues
auth.useDeviceLanguage(); // Use the browser's language
const storage = getStorage(app);

// Add Firestore field value helpers
const FieldValue = {
  increment: (n: number) => ({ __op: 'increment', __val: n }),
  // Add other field value helpers as needed
};

// Extend Firestore with custom field value helpers
const extendedFirestore = {
  ...firestore,
  FieldValue,
  collection: (path: string) => ({
    doc: (id?: string) => {
      const docRef = id ? 
        { id, path: `${path}/${id}` } : 
        { id: Math.random().toString(36).substring(2, 15), path: `${path}/${Math.random().toString(36).substring(2, 15)}` };
      
      return {
        ...docRef,
        get: async () => {
          // Implement document get logic
          return {
            exists: false,
            data: () => ({}),
            id: docRef.id
          };
        },
        set: async (data: Record<string, unknown>) => {
          // Implement document set logic
          console.log(`Setting document at ${docRef.path}:`, data);
        },
        update: async (data: Record<string, unknown>) => {
          // Implement document update logic
          console.log(`Updating document at ${docRef.path}:`, data);
        },
        delete: async () => {
          // Implement document delete logic
          console.log(`Deleting document at ${docRef.path}`);
        }
      };
    },
    where: (field: string, operator: string, value: unknown) => {
      // Implement where query logic
      console.log(`Query where ${field} ${operator}`, value);
      return extendedFirestore.collection(path);
    },
    orderBy: (field: string, direction?: 'asc' | 'desc') => {
      // Implement orderBy query logic
      console.log(`Query orderBy ${field} ${direction || 'asc'}`);
      return extendedFirestore.collection(path);
    },
    limit: (n: number) => {
      // Implement limit query logic
      console.log(`Query limit ${n}`);
      return extendedFirestore.collection(path);
    },
    get: async () => {
      // Implement collection get logic
      return {
        docs: [],
        empty: true,
        size: 0
      };
    }
  }),
  runTransaction: async <T>(callback: (transaction: {
    get: (docRef: { id: string; path: string }) => Promise<{ exists: boolean; data: () => Record<string, unknown>; id: string }>;
    set: (docRef: { id: string; path: string }, data: Record<string, unknown>) => Promise<void>;
    update: (docRef: { id: string; path: string }, data: Record<string, unknown>) => Promise<void>;
    delete: (docRef: { id: string; path: string }) => Promise<void>;
  }) => Promise<T>) => {
    // Implement transaction logic
    const transaction = {
      get: async (docRef: { id: string; path: string }) => {
        // Implement transaction get logic
        return {
          exists: false,
          data: () => ({}),
          id: docRef.id
        };
      },
      set: async (docRef: { id: string; path: string }, data: Record<string, unknown>) => {
        // Implement transaction set logic
        console.log(`Transaction setting document at ${docRef.path}:`, data);
      },
      update: async (docRef: { id: string; path: string }, data: Record<string, unknown>) => {
        // Implement transaction update logic
        console.log(`Transaction updating document at ${docRef.path}:`, data);
      },
      delete: async (docRef: { id: string; path: string }) => {
        // Implement transaction delete logic
        console.log(`Transaction deleting document at ${docRef.path}`);
      }
    };
    
    return await callback(transaction);
  }
};

// For testing environment, add these mock implementations
if (process.env.NODE_ENV === 'test') {
  // Override with test implementations
  Object.assign(extendedFirestore, {
    collection: jest.fn().mockImplementation((path) => ({
      doc: jest.fn().mockImplementation((id) => ({
        id: id || 'mock-id',
        path: `${path}/${id || 'mock-id'}`,
        get: jest.fn().mockResolvedValue({
          exists: false,
          data: () => ({}),
          id: id || 'mock-id'
        }),
        set: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({})
      })),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [],
        empty: true,
        size: 0
      })
    })),
    runTransaction: jest.fn().mockImplementation(async (callback) => {
      const transaction = {
        get: jest.fn().mockResolvedValue({
          exists: false,
          data: () => ({}),
          id: 'mock-id'
        }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      };
      return await callback(transaction);
    }),
    FieldValue: {
      increment: jest.fn().mockImplementation((n) => n)
    }
  });
  
  // Mock auth for testing
  Object.assign(auth, {
    currentUser: null,
    onAuthStateChanged: jest.fn().mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    }),
    signOut: jest.fn().mockResolvedValue({})
  });
}

export { 
  app, 
  extendedFirestore as firestore, 
  auth, 
  storage,
  browserPopupRedirectResolver 
};
/**
 * Server-safe Firebase service exports
 * 
 * This file provides a safe way to access Firebase services in both client and server environments.
 * It uses dynamic imports to ensure Firebase client SDKs are only loaded in the browser.
 */

import { app } from '@/app/lib/firebase';

// Flag to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a placeholder auth object for server-side rendering
const serverAuth = {
  currentUser: null,
  onAuthStateChanged: () => () => {}, // Returns a no-op unsubscribe function
  signOut: async () => {},
  signInWithEmailAndPassword: async () => ({ user: null }),
  createUserWithEmailAndPassword: async () => ({ user: null }),
  sendPasswordResetEmail: async () => {},
};

// Export a safe auth object that works in both environments
export const auth = isBrowser 
  ? null  // Will be initialized on the client side
  : serverAuth;

// Export other Firebase services
export { app };

// Export a function to check if we're in a browser environment
export const isClientSide = () => isBrowser;
