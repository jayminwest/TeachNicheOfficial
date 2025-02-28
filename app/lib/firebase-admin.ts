import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
let firebaseAdminInitialized = false;

export async function initializeFirebaseAdmin() {
  if (!firebaseAdminInitialized) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      firebaseAdminInitialized = true;
    } catch (error: unknown) {
      // App might already be initialized
      if (!/already exists/i.test((error as Error).message)) {
        console.error('Firebase admin initialization error', error);
      }
    }
  }
  return admin.app();
}
