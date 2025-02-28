import { FirebaseAuthService } from './auth/firebase-auth-service';
import { FirestoreDatabase } from './database/firebase-database';
import { FirebaseStorageService } from './storage/firebase-storage-service';
import { FirebaseEmail } from './email/firebase-email';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export class FirebaseServiceFactory {
  static getAuthService(): FirebaseAuthService {
    return new FirebaseAuthService();
  }
  
  static getDatabaseService(): FirestoreDatabase {
    return new FirestoreDatabase();
  }
  
  static getStorageService(): FirebaseStorageService {
    return new FirebaseStorageService();
  }
  
  static getEmailService(): FirebaseEmail {
    return new FirebaseEmail();
  }
}

export const authService = FirebaseServiceFactory.getAuthService();
export const databaseService = FirebaseServiceFactory.getDatabaseService();
export const storageService = FirebaseServiceFactory.getStorageService();
export const emailService = FirebaseServiceFactory.getEmailService();
