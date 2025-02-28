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
  DocumentData,
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

  async create<T extends Record<string, any>>(
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

  async update<T extends Record<string, any>>(
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
    filters?: Record<string, any>,
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
    filters?: Record<string, any>
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
    
    const result = { ...data } as any;
    
    Object.entries(result).forEach(([key, value]) => {
      if (value instanceof Timestamp) {
        result[key] = value.toDate();
      } else if (value && typeof value === 'object') {
        result[key] = this.convertTimestamps(value);
      }
    });
    
    return result as T;
  }
}
