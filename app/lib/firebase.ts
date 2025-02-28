/**
 * Firebase configuration and initialization
 * 
 * This file centralizes all Firebase-related initialization and exports
 * the Firebase services used throughout the application.
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// In development, warn about missing environment variables
if (process.env.NODE_ENV === 'development') {
  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing Firebase environment variables: ${missingVars.join(', ')}\n` +
      `Firebase functionality may be limited. Check your .env.local file.`
    );
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'teachnicheofficial',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Fallback configuration for development if env vars are missing
if (process.env.NODE_ENV === 'development' && 
    (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)) {
  console.warn('Using fallback Firebase configuration for development');
  Object.assign(firebaseConfig, {
    apiKey: firebaseConfig.apiKey || "AIzaSyBmNSa2Wd_RuUTVSwUMxbxgUI2BfA-2gxM",
    authDomain: firebaseConfig.authDomain || "teachnicheofficial.firebaseapp.com",
    projectId: firebaseConfig.projectId || "teachnicheofficial",
    storageBucket: firebaseConfig.storageBucket || "teachnicheofficial.appspot.com",
    messagingSenderId: firebaseConfig.messagingSenderId || "1234567890",
    appId: firebaseConfig.appId || "1:1234567890:web:abcdef1234567890",
  });
}

// Initialize Firebase only once
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

try {
  // Check if we have the minimum required configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error('Missing required Firebase configuration. Check your environment variables.');
  }

  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize services
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
  
  // Log successful initialization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase initialized successfully with config:', 
      JSON.stringify({
        apiKey: firebaseConfig.apiKey ? '***' : undefined,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
      })
    );
  }
  
  // Connect to emulators in development if FIREBASE_USE_EMULATORS is set
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
    if (typeof window !== 'undefined') {
      // Only connect to emulators in browser environment
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(firestore, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      
      console.log('🔥 Connected to Firebase emulators');
    }
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw new Error('Failed to initialize Firebase. Check your configuration.');
}

export { app, auth, firestore, storage, functions };

/**
 * Helper function to determine if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return getApps().length > 0;
}
