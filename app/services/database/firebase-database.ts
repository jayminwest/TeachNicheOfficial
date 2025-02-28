import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryConstraint,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { DatabaseService } from './interface';

export class FirestoreDatabase implements DatabaseService {
  private db;

  constructor() {
    const app = getApp();
    this.db = getFirestore(app);
  }

  from(table: string) {
    return {
      select: (columns?: string) => ({
        eq: async (column: string, value: unknown): Promise<DatabaseResponse<unknown>> => {
          try {
            const collectionRef = collection(this.db, table);
            const q = query(collectionRef, where(column, '==', value));
            const querySnapshot = await getDocs(q);
            
            const results: unknown[] = [];
            querySnapshot.forEach((doc) => {
              const data = this.convertTimestamps(doc.data());
              results.push({ id: doc.id, ...data });
            });
            
            return {
              data: results,
              error: null
            };
          } catch (error) {
            console.error(`Error in from().select().eq():`, error);
            return {
              data: null,
              error: error instanceof Error ? error : new Error('Unknown error')
            };
          }
        },
        match: (queryParams: Record<string, unknown>) => ({
          maybeSingle: async (): Promise<DatabaseResponse<unknown>> => {
            try {
              const collectionRef = collection(this.db, table);
              const constraints: QueryConstraint[] = [];
              
              Object.entries(queryParams).forEach(([field, value]) => {
                constraints.push(where(field, '==', value));
              });
              
              const q = query(collectionRef, ...constraints);
              const querySnapshot = await getDocs(q);
              
              if (querySnapshot.empty) {
                return { data: null, error: null };
              }
              
              const doc = querySnapshot.docs[0];
              const data = this.convertTimestamps(doc.data());
              
              return {
                data: { id: doc.id, ...data },
                error: null
              };
            } catch (error) {
              console.error(`Error in from().select().match().maybeSingle():`, error);
              return {
                data: null,
                error: error instanceof Error ? error : new Error('Unknown error')
              };
            }
          }
        }),
        maybeSingle: async (): Promise<DatabaseResponse<unknown>> => {
          try {
            const collectionRef = collection(this.db, table);
            const querySnapshot = await getDocs(query(collectionRef, limit(1)));
            
            if (querySnapshot.empty) {
              return { data: null, error: null };
            }
            
            const doc = querySnapshot.docs[0];
            const data = this.convertTimestamps(doc.data());
            
            return {
              data: { id: doc.id, ...data },
              error: null
            };
          } catch (error) {
            console.error(`Error in from().select().maybeSingle():`, error);
            return {
              data: null,
              error: error instanceof Error ? error : new Error('Unknown error')
            };
          }
        }
      }),
      insert: async (data: unknown): Promise<DatabaseResponse<unknown>> => {
        try {
          const collectionRef = collection(this.db, table);
          const docRef = doc(collectionRef);
          
          const dataWithTimestamps = {
            ...data as Record<string, unknown>,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          };
          
          await setDoc(docRef, dataWithTimestamps);
          
          return {
            data: { id: docRef.id, ...data },
            error: null
          };
        } catch (error) {
          console.error(`Error in from().insert():`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      },
      update: async (data: unknown, options?: { eq: [string, unknown][] }): Promise<DatabaseResponse<unknown>> => {
        try {
          if (!options?.eq || options.eq.length === 0) {
            throw new Error('Update requires eq options');
          }
          
          const collectionRef = collection(this.db, table);
          const constraints: QueryConstraint[] = [];
          
          options.eq.forEach(([field, value]) => {
            constraints.push(where(field, '==', value));
          });
          
          const q = query(collectionRef, ...constraints);
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            return { 
              data: null, 
              error: new Error('No document found to update') 
            };
          }
          
          const docRef = querySnapshot.docs[0].ref;
          const dataWithTimestamp = {
            ...data as Record<string, unknown>,
            updated_at: serverTimestamp()
          };
          
          await updateDoc(docRef, dataWithTimestamp);
          
          return {
            data: { id: docRef.id, ...data },
            error: null
          };
        } catch (error) {
          console.error(`Error in from().update():`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      },
      delete: async (options?: { eq: [string, unknown][] }): Promise<DatabaseResponse<unknown>> => {
        try {
          if (!options?.eq || options.eq.length === 0) {
            throw new Error('Delete requires eq options');
          }
          
          const collectionRef = collection(this.db, table);
          const constraints: QueryConstraint[] = [];
          
          options.eq.forEach(([field, value]) => {
            constraints.push(where(field, '==', value));
          });
          
          const q = query(collectionRef, ...constraints);
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            return { 
              data: null, 
              error: new Error('No document found to delete') 
            };
          }
          
          const docRef = querySnapshot.docs[0].ref;
          await deleteDoc(docRef);
          
          return {
            data: { success: true },
            error: null
          };
        } catch (error) {
          console.error(`Error in from().delete():`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      }
    };
  }

  async create<T extends Record<string, unknown>>(
    table: string, 
    data: T, 
    id?: string
  ): Promise<string> {
    try {
      const dataWithTimestamps = {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      if (id) {
        const docRef = doc(this.db, table, id);
        await setDoc(docRef, dataWithTimestamps);
        return id;
      } else {
        const collectionRef = collection(this.db, table);
        const docRef = doc(collectionRef);
        await setDoc(docRef, dataWithTimestamps);
        return docRef.id;
      }
    } catch (error) {
      console.error(`Error creating document in ${table}:`, error);
      throw error;
    }
  }

  async get<T>(
    table: string, 
    id: string
  ): Promise<T | null> {
    try {
      const docRef = doc(this.db, table, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as T;
        return this.convertTimestamps(data);
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error getting document from ${table}:`, error);
      throw error;
    }
  }

  async update<T extends Record<string, unknown>>(
    table: string, 
    id: string, 
    data: Partial<T>
  ): Promise<boolean> {
    try {
      const docRef = doc(this.db, table, id);
      const dataWithTimestamp = {
        ...data,
        updated_at: serverTimestamp()
      };
      
      await updateDoc(docRef, dataWithTimestamp);
      return true;
    } catch (error) {
      console.error(`Error updating document in ${table}:`, error);
      throw error;
    }
  }

  async delete(
    table: string, 
    id: string
  ): Promise<boolean> {
    try {
      const docRef = doc(this.db, table, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${table}:`, error);
      throw error;
    }
  }

  async list<T>(
    table: string,
    filters?: Record<string, string | number | boolean | null>,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    pageSize?: number,
    startAfterDoc?: string
  ): Promise<T[]> {
    try {
      const collectionRef = collection(this.db, table);
      const queryConstraints: QueryConstraint[] = [];
      
      if (filters) {
        Object.entries(filters).forEach(([field, value]) => {
          queryConstraints.push(where(field, '==', value));
        });
      }
      
      if (sortField) {
        queryConstraints.push(orderBy(sortField, sortDirection || 'asc'));
      }
      
      if (pageSize) {
        queryConstraints.push(limit(pageSize));
      }
      
      if (startAfterDoc && sortField) {
        const startDoc = await this.get(table, startAfterDoc);
        if (startDoc) {
          if (startDoc && typeof sortField === 'string' && typeof startDoc === 'object' && startDoc !== null && sortField in startDoc) {
            queryConstraints.push(startAfter(startDoc[sortField as keyof typeof startDoc]));
          }
        }
      }
      
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const results: T[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as T;
        results.push(this.convertTimestamps(data));
      });
      
      return results;
    } catch (error) {
      console.error(`Error listing documents from ${table}:`, error);
      throw error;
    }
  }

  async count(
    table: string,
    filters?: Record<string, string | number | boolean | null>
  ): Promise<number> {
    try {
      const result = await this.list(table, filters);
      return result.length;
    } catch (error) {
      console.error(`Error counting documents in ${table}:`, error);
      throw error;
    }
  }

  private convertTimestamps<T>(data: T): T {
    if (!data) return data;
    
    const result = { ...data } as Record<string, unknown>;
    
    Object.entries(result).forEach(([key, value]) => {
      if (value instanceof Timestamp) {
        result[key] = value.toDate();
      } else if (value && typeof value === 'object') {
        result[key] = this.convertTimestamps(value as Record<string, unknown>);
      }
    });
    
    return result as T;
  }

  // Implement required DatabaseService methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async query<T = unknown>(text: string, _params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    console.warn('Firestore does not support raw SQL queries. Using alternative implementation.');
    // This is a simplified implementation to satisfy the interface
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [collectionPart, _limitPart] = text.split(' LIMIT ');
    const collectionName = collectionPart.replace('SELECT * FROM ', '').trim();
    
    const results = await this.list(collectionName);
    return {
      rows: results as unknown as T[],
      rowCount: results.length
    };
  }

  async getCategories(): Promise<{ id: string; name: string; description?: string; created_at: string; updated_at: string; }[]> {
    const categories = await this.list<{ id: string; name: string; description?: string; created_at: string; updated_at: string; }>('categories');
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getLessons(limit = 10, offset = 0, filters: Record<string, string | number | boolean> = {}): Promise<Record<string, unknown>[]> {
    const lessons = await this.list<Record<string, unknown>>('lessons', filters);
    // Sort by created_at in descending order
    const sorted = lessons.sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at as string);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at as string);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Apply pagination
    return sorted.slice(offset, offset + limit);
  }
}
