/**
 * Mock Firebase functionality for test data generation
 */

import { randomUUID } from 'crypto';

// Mock Firebase Auth
export const mockAuth = {
  createUser: async (userData: any) => {
    return {
      uid: userData.uid || randomUUID(),
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL || null,
      emailVerified: true,
      disabled: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [],
      toJSON: () => ({ uid: userData.uid })
    };
  },
  
  updateUser: async (uid: string, userData: any) => {
    return {
      uid,
      ...userData,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [],
      toJSON: () => ({ uid })
    };
  },
  
  deleteUser: async (uid: string) => {
    return true;
  }
};

// Mock Firestore
export const mockFirestore = {
  collection: (collectionName: string) => ({
    doc: (docId?: string) => {
      const id = docId || randomUUID();
      return {
        id,
        set: async (data: any) => ({ id, ...data }),
        update: async (data: any) => ({ id, ...data }),
        delete: async () => true,
        get: async () => ({
          exists: true,
          data: () => ({ id }),
          id
        })
      };
    },
    add: async (data: any) => {
      const id = randomUUID();
      return { id, ...data };
    },
    where: () => ({
      get: async () => ({
        empty: false,
        docs: [],
        forEach: (callback: Function) => {}
      })
    })
  })
};

// Mock Firebase Storage
export const mockStorage = {
  bucket: (bucketName?: string) => ({
    file: (filePath: string) => ({
      save: async (data: any, options?: any) => true,
      delete: async () => true,
      getSignedUrl: async (options: any) => {
        return [`https://storage.googleapis.com/mock-bucket/${filePath}`, new Date()];
      }
    }),
    upload: async (filePath: string, options?: any) => {
      return [{ name: filePath }];
    }
  })
};

// Initialize mock Firebase
export function initMockFirebase() {
  console.log('Initialized mock Firebase for test data generation');
  return {
    auth: mockAuth,
    firestore: mockFirestore,
    storage: mockStorage
  };
}
