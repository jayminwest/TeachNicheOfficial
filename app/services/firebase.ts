import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
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
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
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
        set: async (data: any) => {
          // Implement document set logic
          console.log(`Setting document at ${docRef.path}:`, data);
        },
        update: async (data: any) => {
          // Implement document update logic
          console.log(`Updating document at ${docRef.path}:`, data);
        },
        delete: async () => {
          // Implement document delete logic
          console.log(`Deleting document at ${docRef.path}`);
        }
      };
    },
    where: (field: string, operator: string, value: any) => {
      // Implement where query logic
      return extendedFirestore.collection(path);
    },
    orderBy: (field: string, direction?: 'asc' | 'desc') => {
      // Implement orderBy query logic
      return extendedFirestore.collection(path);
    },
    limit: (n: number) => {
      // Implement limit query logic
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
  runTransaction: async (callback: (transaction: any) => Promise<any>) => {
    // Implement transaction logic
    const transaction = {
      get: async (docRef: any) => {
        // Implement transaction get logic
        return {
          exists: false,
          data: () => ({}),
          id: docRef.id
        };
      },
      set: async (docRef: any, data: any) => {
        // Implement transaction set logic
        console.log(`Transaction setting document at ${docRef.path}:`, data);
      },
      update: async (docRef: any, data: any) => {
        // Implement transaction update logic
        console.log(`Transaction updating document at ${docRef.path}:`, data);
      },
      delete: async (docRef: any) => {
        // Implement transaction delete logic
        console.log(`Transaction deleting document at ${docRef.path}`);
      }
    };
    
    return await callback(transaction);
  }
};

export { 
  app, 
  extendedFirestore as firestore, 
  auth, 
  storage,
  browserPopupRedirectResolver 
};
