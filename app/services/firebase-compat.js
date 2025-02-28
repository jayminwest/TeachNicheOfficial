/**
 * Firebase Compatibility Layer
 * 
 * This module provides a compatibility layer for Firebase that mimics the Supabase API.
 * It allows for easier migration from Supabase to Firebase by providing a similar interface.
 */

// Import Firebase directly to avoid ESM issues
import { initializeApp, getApp } from 'firebase/app';
import { 
  getFirestore,
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment as firestoreIncrement
} from 'firebase/firestore';
import { 
  getStorage,
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForTesting",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "teach-niche.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "teachnicheofficial",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "teachnicheofficial.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase or get existing instance
let app;
try {
  // Try to get existing Firebase app instance
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If error is about duplicate app, get the existing instance
  if (error.code === 'app/duplicate-app') {
    // Get the existing app by name
    try {
      app = getApp();
    } catch (/* unused */) {
      // If getApp fails, initialize with config again as fallback
      app = initializeApp(firebaseConfig, 'teach-niche-app');
    }
  } else {
    // Re-throw if it's a different error
    throw error;
  }
}

const firestore = getFirestore(app);
const storage = getStorage(app);

/**
 * Firebase client with Supabase-like API
 */
export const firebaseClient = {
  /**
   * Firestore operations
   */
  from: (collectionName) => {
    const collectionRef = collection(firestore, collectionName);
    
    return {
      /**
       * Insert a document into the collection
       */
      insert: async (data) => {
        try {
          const docRef = await addDoc(collectionRef, {
            ...data,
            created_at: data.created_at || new Date().toISOString()
          });
          
          // Get the document to return it with the ID
          const docSnap = await getDoc(docRef);
          
          return {
            data: { id: docRef.id, ...docSnap.data() },
            error: null
          };
        } catch (error) {
          return {
            data: null,
            error: { message: error instanceof Error ? error.message : String(error) }
          };
        }
      },
      
      /**
       * Select documents from the collection
       */
      select: () => {
        let queryRef = collectionRef;
        const filters = [];
        const queryBuilder = {
          eq: (field, value) => {
            filters.push(where(field, '==', value));
            return queryBuilder;
          },
          
          gt: (field, value) => {
            filters.push(where(field, '>', value));
            return queryBuilder;
          },
          
          lt: (field, value) => {
            filters.push(where(field, '<', value));
            return queryBuilder;
          },
          
          orderBy: (field, direction = 'asc') => {
            filters.push(orderBy(field, direction));
            return queryBuilder;
          },
          
          // Add order method as an alias for orderBy for Supabase compatibility
          order: (field, { ascending } = {}) => {
            const direction = ascending === false ? 'desc' : 'asc';
            filters.push(orderBy(field, direction));
            return queryBuilder;
          },
          
          limit: (count) => {
            filters.push(limit(count));
            return queryBuilder;
          },
          
          // Add get method for compatibility with Supabase
          get: async () => {
            try {
              queryRef = query(collectionRef, ...filters);
              const querySnapshot = await getDocs(queryRef);
              
              const results = [];
              querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
              });
              
              return {
                data: results,
                error: null
              };
            } catch (error) {
              return {
                data: [], // Return empty array instead of null
                error: { message: error instanceof Error ? error.message : String(error) }
              };
            }
          },
          
          execute: async () => {
            try {
              queryRef = query(collectionRef, ...filters);
              const querySnapshot = await getDocs(queryRef);
              
              const results = [];
              querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
              });
              
              return {
                data: results,
                error: null
              };
            } catch (error) {
              return {
                data: [], // Return empty array instead of null
                error: { message: error instanceof Error ? error.message : String(error) }
              };
            }
          }
        };
        
        return queryBuilder; // Return the queryBuilder object
      },
      
      /**
       * Update a document in the collection
       */
      update: async (data, filter) => {
        try {
          if (!filter || !filter.eq || !Array.isArray(filter.eq) || filter.eq.length !== 2) {
            throw new Error('Invalid filter. Must provide eq filter with field and value.');
          }
          
          const [field, value] = filter.eq;
          
          // Query for the document
          const q = query(collectionRef, where(field, '==', value));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            return {
              data: [], // Return empty array instead of null
              error: { message: 'Document not found' }
            };
          }
          
          // Update the document
          const docRef = doc(firestore, querySnapshot.docs[0].ref.path, querySnapshot.docs[0].id);
          await updateDoc(docRef, {
            ...data,
            updated_at: new Date().toISOString()
          });
          
          return {
            data: { id: docRef.id },
            error: null
          };
        } catch (error) {
          return {
            data: null,
            error: { message: error instanceof Error ? error.message : String(error) }
          };
        }
      },
      
      /**
       * Delete a document from the collection
       */
      delete: async (filter) => {
        try {
          if (!filter || !filter.eq || !Array.isArray(filter.eq) || filter.eq.length !== 2) {
            throw new Error('Invalid filter. Must provide eq filter with field and value.');
          }
          
          const [field, value] = filter.eq;
          
          // Query for the document
          const q = query(collectionRef, where(field, '==', value));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            return {
              data: [], // Return empty array instead of null
              error: { message: 'Document not found' }
            };
          }
          
          // Delete the document
          const docRef = doc(firestore, querySnapshot.docs[0].ref.path);
          await deleteDoc(docRef);
          
          return {
            data: { id: docRef.id },
            error: null
          };
        } catch (error) {
          return {
            data: null,
            error: { message: error instanceof Error ? error.message : String(error) }
          };
        }
      }
    };
  },
  
  /**
   * Helper functions
   */
  increment: (n) => firestoreIncrement(n),
  
  /**
   * Storage operations
   */
  storage: {
    from: (bucketName) => {
      return {
        /**
         * Upload a file to storage
         */
        upload: async (path, file) => {
          try {
            const storageRef = ref(storage, `${bucketName}/${path}`);
            const result = await uploadBytes(storageRef, file);
            
            return {
              data: {
                path: result.ref.fullPath,
                size: result.totalBytes,
                contentType: result.metadata.contentType
              },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : String(error) }
            };
          }
        },
        
        /**
         * Get a public URL for a file
         */
        getPublicUrl: (path) => {
          try {
            const publicUrl = `https://storage.googleapis.com/${storage.app.options.storageBucket}/${bucketName}/${path}`;
            
            return {
              data: { publicUrl },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : String(error) }
            };
          }
        },
        
        /**
         * Download a file
         */
        download: async (path) => {
          try {
            const storageRef = ref(storage, `${bucketName}/${path}`);
            const url = await getDownloadURL(storageRef);
            
            return {
              data: { url },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : String(error) }
            };
          }
        },
        
        /**
         * Remove files from storage
         */
        remove: async (paths) => {
          try {
            if (!Array.isArray(paths)) {
              throw new Error('Paths must be an array');
            }
            
            const promises = paths.map(async (path) => {
              const storageRef = ref(storage, `${bucketName}/${path}`);
              await deleteObject(storageRef);
            });
            
            await Promise.all(promises);
            
            return {
              data: { paths },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : String(error) }
            };
          }
        },
        
        /**
         * List files in a directory
         */
        list: async (prefix = '') => {
          try {
            const storageRef = ref(storage, `${bucketName}/${prefix}`);
            const result = await listAll(storageRef);
            
            const files = result.items.map(item => ({
              name: item.name,
              fullPath: item.fullPath
            }));
            
            return {
              data: { files },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : String(error) }
            };
          }
        }
      };
    }
  }
};

// For testing environment
if (process.env.NODE_ENV === 'test') {
  // Mock implementations for testing
  firebaseClient.from = jest.fn().mockImplementation((/* unused */) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    update: jest.fn().mockResolvedValue({ error: null }),
    delete: jest.fn().mockResolvedValue({ error: null })
  }));
  
  firebaseClient.increment = jest.fn().mockImplementation((n) => n);
  
  firebaseClient.storage = {
    from: jest.fn().mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/mock-file' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: { url: 'https://example.com/mock-file' }, error: null }),
      remove: jest.fn().mockResolvedValue({ data: { paths: ['mock-path'] }, error: null }),
      list: jest.fn().mockResolvedValue({ data: { files: [] }, error: null })
    }))
  };
}

// Add default export for compatibility with import statements
export default firebaseClient;
