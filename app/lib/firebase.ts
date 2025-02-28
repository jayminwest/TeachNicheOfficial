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

// Define types for our Firebase services
type FirestoreType = import('firebase/firestore').Firestore;
type StorageType = import('firebase/storage').FirebaseStorage;
type FunctionsType = import('firebase/functions').Functions;
type AuthType = import('firebase/auth').Auth;

// Declare variables to hold our Firebase services
let app: FirebaseApp;
let firestore: FirestoreType | null = null;
let storage: StorageType | null = null;
let functions: FunctionsType | null = null;
let auth: AuthType | null = null;

// Flag to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

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

// Initialize Firebase app
function initializeFirebaseApp() {
  try {
    // Check if we have the minimum required configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error('Missing required Firebase configuration. Check your environment variables.');
    }

    // Initialize Firebase
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    console.log('Firebase app initialized successfully with project:', firebaseConfig.projectId);
    return app;
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    throw new Error('Failed to initialize Firebase app. Check your configuration.');
  }
}

// Initialize Firebase app
app = initializeFirebaseApp();

// Client-side only imports and initialization
if (isBrowser) {
  // Initialize Firestore
  import('firebase/firestore').then(({ getFirestore, connectFirestoreEmulator }) => {
    firestore = getFirestore(app);
    
    // Connect to emulator if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
      connectFirestoreEmulator(firestore, 'localhost', 8080);
    }
  }).catch(error => {
    console.error('Failed to initialize Firestore:', error);
  });
  
  // Initialize Storage
  import('firebase/storage').then(({ getStorage, connectStorageEmulator }) => {
    storage = getStorage(app);
    
    // Connect to emulator if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  }).catch(error => {
    console.error('Failed to initialize Storage:', error);
  });
  
  // Initialize Functions
  import('firebase/functions').then(({ getFunctions, connectFunctionsEmulator }) => {
    functions = getFunctions(app);
    
    // Connect to emulator if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  }).catch(error => {
    console.error('Failed to initialize Functions:', error);
  });
  
  // Initialize Auth
  import('firebase/auth').then(({ getAuth, connectAuthEmulator }) => {
    auth = getAuth(app);
    
    // Connect to emulator if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
  }).catch(error => {
    console.error('Failed to initialize Auth:', error);
  });
  
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true') {
    console.log('🔥 Connected to Firebase emulators');
  }
}

// Export the Firebase services
export { app };

// Export getters for the services to ensure they're only accessed after initialization
export function getFirestore() {
  if (!isBrowser) {
    console.warn('Attempted to access Firestore on the server side. This is not supported.');
    return null;
  }
  return firestore;
}

export function getStorage() {
  if (!isBrowser) {
    console.warn('Attempted to access Storage on the server side. This is not supported.');
    return null;
  }
  return storage;
}

export function getFunctions() {
  if (!isBrowser) {
    console.warn('Attempted to access Functions on the server side. This is not supported.');
    return null;
  }
  return functions;
}

export function getAuth() {
  if (!isBrowser) {
    console.warn('Attempted to access Auth on the server side. This is not supported.');
    return null;
  }
  
  // If auth is not initialized yet, return null
  // The client component will handle initialization
  return auth;
}

// Create a server-safe version of Firebase for server components
export const serverSafeFirebase = {
  app,
  // Add any server-safe methods here
};

/**
 * Helper function to determine if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return getApps().length > 0;
}
