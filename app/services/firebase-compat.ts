/**
 * Firebase Compatibility Layer
 * 
 * This module provides a compatibility layer for code that was previously using Supabase.
 * It implements similar interfaces and methods but uses Firebase under the hood.
 */

import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Query
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  StorageReference 
} from 'firebase/storage';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  UserCredential,
  User
} from 'firebase/auth';
import { app } from '../lib/firebase';

// Initialize Firebase services
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Define types for error handling
interface FirebaseError {
  code?: string;
  message: string;
}

// Define types for query values
type QueryValue = string | number | boolean | null;

// Define response types
interface AuthResponse<T = User | null> {
  data: { user: T };
  error: FirebaseError | null;
}

interface DataResponse<T = unknown> {
  data: T | null;
  error: FirebaseError | null;
}

interface ErrorResponse {
  error: FirebaseError | null;
}

interface StorageResponse {
  data: { 
    path?: string;
    url?: string;
    publicUrl?: string;
  } | null;
  error: FirebaseError | null;
}

// Create a compatibility layer that mimics Supabase client structure
export const firebaseClient = {
  // Auth compatibility
  auth: {
    signIn: async ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
      try {
        const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        return { data: { user: userCredential.user }, error: null };
      } catch (error: unknown) {
        const firebaseError = error as FirebaseError;
        return { data: { user: null }, error: firebaseError };
      }
    },
    signUp: async ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
      try {
        const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { data: { user: userCredential.user }, error: null };
      } catch (error: unknown) {
        const firebaseError = error as FirebaseError;
        return { data: { user: null }, error: firebaseError };
      }
    },
    signOut: async (): Promise<ErrorResponse> => {
      try {
        await signOut(auth);
        return { error: null };
      } catch (error: unknown) {
        const firebaseError = error as FirebaseError;
        return { error: firebaseError };
      }
    },
    getUser: (): AuthResponse => {
      const user = auth.currentUser;
      return { data: { user }, error: null };
    }
  },
  
  // Firestore compatibility (mimicking Supabase's .from().select() pattern)
  from: (tableName: string) => {
    const collectionRef: CollectionReference = collection(firestore, tableName);
    
    return {
      select: () => {
        // In Firebase, we don't need to specify columns to select
        return {
          eq: async (column: string, value: QueryValue): Promise<DataResponse<DocumentData[]>> => {
            try {
              const q: Query = query(collectionRef, where(column, '==', value));
              const querySnapshot = await getDocs(q);
              const data = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ 
                id: doc.id, 
                ...doc.data() 
              }));
              return { data, error: null };
            } catch (error: unknown) {
              const firebaseError = error as FirebaseError;
              return { data: null, error: firebaseError };
            }
          },
          
          // Add other query methods as needed
          order: (column: string, { ascending = true } = {}) => {
            const direction = ascending ? 'asc' : 'desc';
            return {
              limit: (limitCount: number) => {
                return {
                  eq: async (column: string, value: QueryValue): Promise<DataResponse<DocumentData[]>> => {
                    try {
                      const q: Query = query(
                        collectionRef, 
                        where(column, '==', value),
                        orderBy(column, direction as 'asc' | 'desc'),
                        limit(limitCount)
                      );
                      const querySnapshot = await getDocs(q);
                      const data = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ 
                        id: doc.id, 
                        ...doc.data() 
                      }));
                      return { data, error: null };
                    } catch (error: unknown) {
                      const firebaseError = error as FirebaseError;
                      return { data: null, error: firebaseError };
                    }
                  }
                };
              }
            };
          }
        };
      },
      
      insert: async (data: Record<string, unknown>): Promise<DataResponse> => {
        try {
          // Generate a new document ID
          const newDocRef: DocumentReference = doc(collectionRef);
          await setDoc(newDocRef, { ...data, id: newDocRef.id });
          return { data: { id: newDocRef.id, ...data }, error: null };
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          return { data: null, error: firebaseError };
        }
      },
      
      update: async (data: Record<string, unknown>, { eq }: { eq: [string, QueryValue] }): Promise<DataResponse> => {
        try {
          const [column, value] = eq;
          const q: Query = query(collectionRef, where(column, '==', value));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            throw new Error('No document found to update');
          }
          
          // Update all matching documents
          const updatePromises = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => 
            updateDoc(doc.ref, data as Record<string, any>)
          );
          
          await Promise.all(updatePromises);
          return { data, error: null };
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          return { data: null, error: firebaseError };
        }
      },
      
      delete: async ({ eq }: { eq: [string, QueryValue] }): Promise<ErrorResponse> => {
        try {
          const [column, value] = eq;
          const q: Query = query(collectionRef, where(column, '==', value));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            throw new Error('No document found to delete');
          }
          
          // Delete all matching documents
          const deletePromises = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => 
            deleteDoc(doc.ref)
          );
          
          await Promise.all(deletePromises);
          return { error: null };
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          return { error: firebaseError };
        }
      }
    };
  },
  
  // Storage compatibility
  storage: {
    from: (bucketName: string) => {
      return {
        upload: async (path: string, file: File | Blob | ArrayBuffer | Buffer): Promise<StorageResponse> => {
          try {
            const fileRef: StorageReference = ref(storage, `${bucketName}/${path}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return { data: { path, url }, error: null };
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            return { data: null, error: firebaseError };
          }
        },
        
        getPublicUrl: (path: string): StorageResponse => {
          try {
            return { 
              data: { 
                publicUrl: `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(`${bucketName}/${path}`)}?alt=media` 
              }, 
              error: null 
            };
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            return { data: null, error: firebaseError };
          }
        },
        
        remove: async (paths: string[]): Promise<StorageResponse> => {
          try {
            const deletePromises = paths.map(path => {
              const fileRef: StorageReference = ref(storage, `${bucketName}/${path}`);
              return deleteObject(fileRef);
            });
            
            await Promise.all(deletePromises);
            return { data: null, error: null };
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            return { data: null, error: firebaseError };
          }
        }
      };
    }
  }
};

// Export a function to get the Firebase compatibility client
export function getFirebaseCompat() {
  return firebaseClient;
}

// Default export for backward compatibility
export default firebaseClient;
