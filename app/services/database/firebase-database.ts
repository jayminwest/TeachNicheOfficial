import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query as firestoreQuery, 
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
          queryConstraints.push(startAfter(startDoc[sortField]));
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
  async query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    console.warn('Firestore does not support raw SQL queries. Using alternative implementation.');
    // This is a simplified implementation to satisfy the interface
    const [collection, limit] = text.split(' LIMIT ');
    const collectionName = collection.replace('SELECT * FROM ', '').trim();
    
    const results = await this.list(collectionName);
    return {
      rows: results as unknown as T[],
      rowCount: results.length
    };
  }

  async getCategories(): Promise<{ id: string; name: string; created_at: string; updated_at: string; }[]> {
    const categories = await this.list<{ id: string; name: string; created_at: string; updated_at: string; }>('categories');
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
