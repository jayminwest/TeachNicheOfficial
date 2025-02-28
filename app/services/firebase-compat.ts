/**
 * Firebase Compatibility Layer
 * 
 * This module provides a compatibility layer for code that was previously using Supabase.
 * It implements similar interfaces and methods but uses Firebase under the hood.
 */

import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from '@/app/lib/firebase';

// Initialize Firebase services
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Create a compatibility layer that mimics Supabase client structure
export const firebaseClient = {
  // Auth compatibility
  auth: {
    signIn: async ({ email, password }: { email: string; password: string }) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { data: { user: userCredential.user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { data: { user: userCredential.user }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    },
    signOut: async () => {
      try {
        await signOut(auth);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    getUser: () => {
      const user = auth.currentUser;
      return { data: { user }, error: null };
    }
  },
  
  // Firestore compatibility (mimicking Supabase's .from().select() pattern)
  from: (tableName: string) => {
    const collectionRef = collection(firestore, tableName);
    
    return {
      select: (columns = '*') => {
        // In Firebase, we don't need to specify columns to select
        return {
          eq: async (column: string, value: any) => {
            try {
              const q = query(collectionRef, where(column, '==', value));
              const querySnapshot = await getDocs(q);
              const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          
          // Add other query methods as needed
          order: (column: string, { ascending = true } = {}) => {
            const direction = ascending ? 'asc' : 'desc';
            return {
              limit: (limitCount: number) => {
                return {
                  eq: async (column: string, value: any) => {
                    try {
                      const q = query(
                        collectionRef, 
                        where(column, '==', value),
                        orderBy(column, direction as 'asc' | 'desc'),
                        limit(limitCount)
                      );
                      const querySnapshot = await getDocs(q);
                      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                      return { data, error: null };
                    } catch (error) {
                      return { data: null, error };
                    }
                  }
                };
              }
            };
          }
        };
      },
      
      insert: async (data: any) => {
        try {
          // Generate a new document ID
          const newDocRef = doc(collectionRef);
          await setDoc(newDocRef, { ...data, id: newDocRef.id });
          return { data: { id: newDocRef.id, ...data }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      
      update: async (data: any, { eq }: { eq: [string, any] }) => {
        try {
          const [column, value] = eq;
          const q = query(collectionRef, where(column, '==', value));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            throw new Error('No document found to update');
          }
          
          // Update all matching documents
          const updatePromises = querySnapshot.docs.map(doc => 
            updateDoc(doc.ref, data)
          );
          
          await Promise.all(updatePromises);
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      
      delete: async ({ eq }: { eq: [string, any] }) => {
        try {
          const [column, value] = eq;
          const q = query(collectionRef, where(column, '==', value));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            throw new Error('No document found to delete');
          }
          
          // Delete all matching documents
          const deletePromises = querySnapshot.docs.map(doc => 
            deleteDoc(doc.ref)
          );
          
          await Promise.all(deletePromises);
          return { error: null };
        } catch (error) {
          return { error };
        }
      }
    };
  },
  
  // Storage compatibility
  storage: {
    from: (bucketName: string) => {
      return {
        upload: async (path: string, file: File | Blob | Buffer) => {
          try {
            const storageRef = ref(storage, `${bucketName}/${path}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            return { data: { path, url }, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        
        getPublicUrl: (path: string) => {
          try {
            const storageRef = ref(storage, `${bucketName}/${path}`);
            return { 
              data: { 
                publicUrl: `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(`${bucketName}/${path}`)}?alt=media` 
              }, 
              error: null 
            };
          } catch (error) {
            return { data: null, error };
          }
        },
        
        remove: async (paths: string[]) => {
          try {
            const deletePromises = paths.map(path => {
              const storageRef = ref(storage, `${bucketName}/${path}`);
              return deleteObject(storageRef);
            });
            
            await Promise.all(deletePromises);
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error };
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
/**
 * Firebase Compatibility Layer for Supabase
 * 
 * This file provides a compatibility layer that mimics the Supabase client API
 * but uses Firebase services under the hood. This allows for a gradual migration
 * from Supabase to Firebase without requiring extensive code changes.
 */

import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '@/app/lib/firebase';

// Initialize Firebase services
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Compatibility layer for Supabase client
export const supabase = {
  auth: {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { data: { user: userCredential.user }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
    signIn: async ({ email, password }: { email: string; password: string }) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { data: { user: userCredential.user }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
    signInWithGoogle: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return { data: { user: userCredential.user }, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    },
    signOut: async () => {
      try {
        await signOut(auth);
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    },
    getUser: async () => {
      const user = auth.currentUser;
      if (user) {
        return { data: { user }, error: null };
      }
      return { data: { user: null }, error: null };
    }
  },
  from: (tableName: string) => {
    return {
      select: (columns: string = '*') => {
        return {
          eq: async (column: string, value: any) => {
            try {
              const q = query(collection(firestore, tableName), where(column, '==', value));
              const snapshot = await getDocs(q);
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              return { data, error: null };
            } catch (error: any) {
              return { data: null, error: { message: error.message } };
            }
          },
          order: (column: string, { ascending = true } = {}) => {
            return {
              limit: async (count: number) => {
                try {
                  const q = query(
                    collection(firestore, tableName), 
                    orderBy(column, ascending ? 'asc' : 'desc'),
                    limit(count)
                  );
                  const snapshot = await getDocs(q);
                  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  return { data, error: null };
                } catch (error: any) {
                  return { data: null, error: { message: error.message } };
                }
              }
            };
          }
        };
      },
      insert: async (data: any) => {
        try {
          const docRef = doc(collection(firestore, tableName));
          await setDoc(docRef, { ...data, created_at: new Date().toISOString() });
          return { data: { id: docRef.id, ...data }, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },
      update: async (data: any, { id }: { id: string }) => {
        try {
          const docRef = doc(firestore, tableName, id);
          await updateDoc(docRef, { ...data, updated_at: new Date().toISOString() });
          return { data, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },
      delete: async ({ id }: { id: string }) => {
        try {
          const docRef = doc(firestore, tableName, id);
          await deleteDoc(docRef);
          return { error: null };
        } catch (error: any) {
          return { error: { message: error.message } };
        }
      }
    };
  },
  storage: {
    from: (bucketName: string) => {
      return {
        upload: async (path: string, file: File | Blob | ArrayBuffer) => {
          try {
            const storageRef = ref(storage, `${bucketName}/${path}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            return { data: { path, url }, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
        getPublicUrl: (path: string) => {
          const storageRef = ref(storage, `${bucketName}/${path}`);
          return { publicUrl: `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(`${bucketName}/${path}`)}?alt=media` };
        },
        remove: async (paths: string[]) => {
          try {
            const promises = paths.map(path => {
              const storageRef = ref(storage, `${bucketName}/${path}`);
              return deleteObject(storageRef);
            });
            await Promise.all(promises);
            return { data: null, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        }
      };
    }
  }
};

export default supabase;
