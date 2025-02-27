# Firebase Authentication Reference

## Overview

This document provides a comprehensive reference for Firebase Authentication implementation in the Teach Niche platform. Firebase Authentication provides secure, easy-to-use authentication services that integrate with our Google Cloud Platform infrastructure.

## Authentication Methods

Teach Niche supports the following authentication methods through Firebase:

- Email/Password authentication
- Google OAuth authentication
- Email link authentication (passwordless)

## Implementation Details

### Client-Side Authentication

#### Initialization

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

#### Sign Up

```typescript
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

async function signUp(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with display name
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'profiles', user.uid), {
      full_name: displayName,
      email: email,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    return { user };
  } catch (error) {
    return { error };
  }
}
```

... (rest of the firebase authentication content as provided)
