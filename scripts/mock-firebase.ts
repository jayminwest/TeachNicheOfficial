/**
 * Mock Firebase Implementation
 * 
 * This module provides mock implementations of Firebase services
 * for development and testing without real Firebase credentials.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as colors from 'colors';
import { v4 as uuidv4 } from 'uuid';

// Mock Firestore implementation
class MockFirestore {
  private collections: Map<string, Map<string, any>> = new Map();
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    console.log(`${colors.yellow}Using mock Firestore implementation${colors.reset}`);
    console.log(`${colors.yellow}Data will be stored in ${this.dataDir}${colors.reset}`);
  }

  // Get a collection reference
  collection(collectionName: string) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
      
      // Try to load existing data from JSON file
      const filePath = path.join(this.dataDir, `${collectionName}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.id) {
                this.collections.get(collectionName)!.set(item.id, item);
              }
            });
          }
        } catch (error) {
          console.warn(`${colors.yellow}Failed to load data for collection ${collectionName}:${colors.reset}`, error);
        }
      }
    }
    
    return {
      doc: (id: string) => this.doc(collectionName, id),
      get: () => this.getCollection(collectionName),
      add: (data: any) => this.add(collectionName, data),
      where: () => ({ get: () => this.getCollection(collectionName) }),
      orderBy: () => ({ get: () => this.getCollection(collectionName) }),
      limit: () => ({ get: () => this.getCollection(collectionName) }),
    };
  }

  // Get a document reference
  doc(collectionName: string, id: string) {
    return {
      id,
      set: (data: any) => this.set(collectionName, id, data),
      update: (data: any) => this.update(collectionName, id, data),
      get: () => this.get(collectionName, id),
      delete: () => this.delete(collectionName, id),
    };
  }

  // Create a batch operation
  batch() {
    const operations: Array<() => void> = [];
    
    return {
      set: (docRef: any, data: any) => {
        operations.push(() => this.set(docRef.id.split('/')[0], docRef.id.split('/')[1], data));
      },
      update: (docRef: any, data: any) => {
        operations.push(() => this.update(docRef.id.split('/')[0], docRef.id.split('/')[1], data));
      },
      delete: (docRef: any) => {
        operations.push(() => this.delete(docRef.id.split('/')[0], docRef.id.split('/')[1]));
      },
      commit: async () => {
        operations.forEach(op => op());
        return Promise.resolve();
      },
    };
  }

  // Set document data
  private set(collectionName: string, id: string, data: any) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    
    this.collections.get(collectionName)!.set(id, { id, ...data });
    this.saveCollection(collectionName);
    return Promise.resolve();
  }

  // Update document data
  private update(collectionName: string, id: string, data: any) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    
    const existingData = this.collections.get(collectionName)!.get(id) || { id };
    this.collections.get(collectionName)!.set(id, { ...existingData, ...data });
    this.saveCollection(collectionName);
    return Promise.resolve();
  }

  // Get document data
  private get(collectionName: string, id: string) {
    if (!this.collections.has(collectionName)) {
      return Promise.resolve({ exists: false, data: () => null });
    }
    
    const data = this.collections.get(collectionName)!.get(id);
    return Promise.resolve({
      exists: !!data,
      data: () => data || null,
    });
  }

  // Delete document
  private delete(collectionName: string, id: string) {
    if (this.collections.has(collectionName)) {
      this.collections.get(collectionName)!.delete(id);
      this.saveCollection(collectionName);
    }
    return Promise.resolve();
  }

  // Add document with auto-generated ID
  private add(collectionName: string, data: any) {
    const id = uuidv4();
    this.set(collectionName, id, data);
    return Promise.resolve({ id });
  }

  // Get all documents in a collection
  private getCollection(collectionName: string) {
    if (!this.collections.has(collectionName)) {
      return Promise.resolve({ empty: true, docs: [] });
    }
    
    const docs = Array.from(this.collections.get(collectionName)!.values()).map(data => ({
      id: data.id,
      data: () => data,
      exists: true,
    }));
    
    return Promise.resolve({
      empty: docs.length === 0,
      docs,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback),
    });
  }

  // Save collection data to JSON file
  private saveCollection(collectionName: string) {
    if (!this.collections.has(collectionName)) {
      return;
    }
    
    const data = Array.from(this.collections.get(collectionName)!.values());
    const filePath = path.join(this.dataDir, `${collectionName}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`${colors.red}Failed to save collection ${collectionName}:${colors.reset}`, error);
    }
  }
}

// Export mock implementations
export function getFirestore() {
  return new MockFirestore();
}

export function getStorage() {
  console.log(`${colors.yellow}Using mock Storage implementation${colors.reset}`);
  return {
    bucket: () => ({
      upload: () => Promise.resolve([{ name: 'mock-file' }]),
      file: () => ({
        getSignedUrl: () => Promise.resolve(['https://example.com/mock-signed-url']),
        delete: () => Promise.resolve(),
      }),
    }),
  };
}

export default {
  getFirestore,
  getStorage,
};
