# Firebase Setup Guide

This guide provides step-by-step instructions for setting up Firebase for the Teach Niche platform.

## Prerequisites

- Google account with administrative access
- GCP project already created (see [GCP_SETUP.md](./GCP_SETUP.md))
- Basic understanding of authentication and storage concepts

## Initial Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Select your existing GCP project "teachnicheofficial"
4. Click "Continue"
5. Configure Google Analytics (recommended)
   - Enable Google Analytics for your Firebase project
   - Configure Analytics location
6. Click "Create project"

### 2. Register Your Application

#### Web App

1. On the Firebase project overview page, click the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "Teach Niche Web")
3. Check "Also set up Firebase Hosting" if you plan to use it
4. Click "Register app"
5. Copy the Firebase configuration object for later use
6. Click "Continue to console"

## Setting Up Authentication

### 1. Enable Authentication Methods

1. In the Firebase console, navigate to "Authentication"
2. Click "Get started" if you haven't set up Authentication yet
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - Email/Password
   - Google
   - Apple (if supporting iOS/macOS users)
5. For each provider, click "Enable" and configure the required settings

### 2. Configure Email Templates

1. Go to the "Templates" tab in Authentication
2. Customize each email template:
   - Email verification
   - Password reset
   - Email address change
   - SMS verification
3. Update with your branding, colors, and messaging

### 3. Configure Authentication in Your App

Create a Firebase configuration file in your project:

```typescript
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
```

## Setting Up Firebase Storage

### 1. Configure Storage Rules

1. In the Firebase console, navigate to "Storage"
2. Click "Get started" if you haven't set up Storage yet
3. Select a starting security rule template (Start in production mode)
4. Click "Next" and "Done"
5. Go to the "Rules" tab and update the rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read all files
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Allow users to upload their own profile images
    match /users/{userId}/profile/{fileName} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow creators to upload lesson content
    match /lessons/{lessonId}/{fileName} {
      allow write: if request.auth != null && 
                     exists(/databases/(default)/documents/lessons/$(lessonId)) && 
                     request.auth.uid == resource.data.creator_id;
    }
  }
}
```

### 2. Configure CORS

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to Firebase:
   ```bash
   firebase login
   ```
3. Initialize your project:
   ```bash
   firebase init storage
   ```
4. Create a `cors.json` file:
   ```json
   [
     {
       "origin": ["https://your-domain.com", "http://localhost:3000"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": ["Content-Type", "Authorization"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
5. Upload the CORS configuration:
   ```bash
   gsutil cors set cors.json gs://teachnicheofficial-media
   ```

## Environment Configuration

Add the following variables to your `.env.local` file:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# For server-side Firebase Admin
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="your-private-key"
```

## Setting Up Firebase Admin SDK

For server-side operations, set up the Firebase Admin SDK:

1. In the Firebase console, go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Create a Firebase Admin configuration file:

```typescript
// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
};

const app = getApps().length === 0 
  ? initializeApp(firebaseAdminConfig) 
  : getApps()[0];

const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
```

## Security Best Practices

1. **API Key Restrictions**: Restrict your Firebase API keys in the Google Cloud Console
2. **Authentication Rules**: Implement proper authentication rules
3. **Storage Rules**: Define granular access rules for storage
4. **Regular Audits**: Regularly audit authentication and storage logs
5. **MFA**: Encourage or require multi-factor authentication for sensitive operations
6. **Session Management**: Implement proper session management
7. **Secure Environment Variables**: Keep Firebase credentials secure

## Testing Firebase Integration

1. Set up Firebase Emulators for local development:
   ```bash
   firebase init emulators
   ```
2. Select Authentication and Storage emulators
3. Start the emulators:
   ```bash
   firebase emulators:start
   ```
4. Configure your app to use emulators in development:
   ```typescript
   // In your firebase.ts file
   if (process.env.NODE_ENV === 'development') {
     connectAuthEmulator(auth, 'http://localhost:9099');
     connectStorageEmulator(storage, 'localhost', 9199);
   }
   ```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Firebase configuration values
   - Check if the authentication method is enabled
   - Verify email templates if using email authentication

2. **Storage Access Issues**
   - Check storage rules
   - Verify CORS configuration
   - Ensure proper authentication before storage operations

3. **Firebase Admin SDK Issues**
   - Verify private key format (should include newlines)
   - Check service account permissions
   - Ensure environment variables are correctly set

## Next Steps

After setting up Firebase:

1. Implement authentication flows in your application
2. Set up storage operations for user content
3. Configure security rules for production
4. Set up monitoring and logging
5. Implement user management features

---

*For any issues with this setup, please contact the DevOps team.*
