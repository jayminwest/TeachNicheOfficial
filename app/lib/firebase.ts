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
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

// Only import Auth in client components
let Auth: typeof import('firebase/auth').Auth | undefined;
let getAuth: typeof import('firebase/auth').getAuth | undefined;
let connectAuthEmulator: typeof import('firebase/auth').connectAuthEmulator | undefined;

// Dynamically import auth in client-side only
if (typeof window !== 'undefined') {
  // Using dynamic import with type safety
  import('firebase/auth').then((authModule) => {
    Auth = authModule.Auth;
    getAuth = authModule.getAuth;
    connectAuthEmulator = authModule.connectAuthEmulator;
  }).catch(error => {
    console.error('Failed to load auth module:', error);
  });
}

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

// Only provide fallback configuration if env vars are missing
// This ensures Firebase will initialize even without environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.warn('Using fallback Firebase configuration - this may cause authentication issues');
  // Don't use fallback values for production - they won't work for authentication
  if (process.env.NODE_ENV === 'production') {
    console.error('Missing Firebase configuration in production environment');
  } else {
    Object.assign(firebaseConfig, {
      apiKey: firebaseConfig.apiKey || "AIzaSyBmNSa2Wd_RuUTVSwUMxbxgUI2BfA-2gxM",
      authDomain: firebaseConfig.authDomain || "teachnicheofficial.firebaseapp.com",
      projectId: firebaseConfig.projectId || "teachnicheofficial",
      storageBucket: firebaseConfig.storageBucket || "teachnicheofficial.appspot.com",
      messagingSenderId: firebaseConfig.messagingSenderId || "1234567890",
      appId: firebaseConfig.appId || "1:1234567890:web:abcdef1234567890",
    });
  }
}

// Log the configuration being used (without sensitive values)
console.log('Firebase configuration:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  usingEmulators: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true'
});

// Initialize Firebase only once
let app: FirebaseApp;
let auth: import('firebase/auth').Auth | null = null;
let firestore: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

// Server-side Firebase initialization needs special handling
const isServer = typeof window === 'undefined';

try {
  // Check if we have the minimum required configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error('Missing required Firebase configuration. Check your environment variables.');
  }

  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize services with special handling for server-side
  if (isServer) {
    // Server-side initialization - don't initialize auth
    console.log('Server-side Firebase initialization - skipping auth');
    firestore = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
  } else {
    // Client-side initialization (normal)
    if (getAuth) {
      auth = getAuth(app);
    }
    firestore = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
  }
  
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  
  // Connect to emulators in development if FIREBASE_USE_EMULATORS is set
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
    if (typeof window !== 'undefined') {
      // Only connect to emulators in browser environment
      if (auth && connectAuthEmulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
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
