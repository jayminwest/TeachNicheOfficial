/**
 * Database Connection Factory
 * 
 * This module provides environment-specific database connections
 * for the Teach Niche platform.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Environment types
type Environment = 'development' | 'production' | 'test';

// Get current environment
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  if (!env || (env !== 'development' && env !== 'production' && env !== 'test')) {
    return 'development'; // Default to development
  }
  return env;
}

// Initialize Firebase Admin for server-side operations
function initializeFirebaseAdmin() {
  const environment = getCurrentEnvironment();
  console.log(`Initializing Firebase Admin for ${environment} environment`);
  
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    // Get environment-specific configuration
    let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Override with environment-specific values if available
    if (environment === 'production' && process.env.PROD_FIREBASE_PROJECT_ID) {
      projectId = process.env.PROD_FIREBASE_PROJECT_ID;
      clientEmail = process.env.PROD_FIREBASE_CLIENT_EMAIL || clientEmail;
      privateKey = process.env.PROD_FIREBASE_PRIVATE_KEY || privateKey;
    } else if (environment === 'test' && process.env.TEST_FIREBASE_PROJECT_ID) {
      projectId = process.env.TEST_FIREBASE_PROJECT_ID;
      clientEmail = process.env.TEST_FIREBASE_CLIENT_EMAIL || clientEmail;
      privateKey = process.env.TEST_FIREBASE_PRIVATE_KEY || privateKey;
    }
    
    // Replace escaped newlines with actual newlines
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Initialize the app with environment-specific configuration
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  
  return {
    firestore: getFirestore(),
    storage: getStorage(),
  };
}

// Get database connection for the current environment
export function getDatabaseConnection() {
  const environment = getCurrentEnvironment();
  const { firestore } = initializeFirebaseAdmin();
  
  // Add environment-specific configurations or behaviors
  if (environment === 'development') {
    // Enable verbose logging in development
    firestore.settings({
      ignoreUndefinedProperties: true,
    });
  }
  
  return firestore;
}

// Get storage connection for the current environment
export function getStorageConnection() {
  const { storage } = initializeFirebaseAdmin();
  return storage;
}

// Export a default database instance for the current environment
const db = getDatabaseConnection();
export default db;
