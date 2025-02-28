# Supabase to Firebase Migration Guide

## Migration Steps

### 1. Update Dependencies
```bash
npm run scripts/update-dependencies.ts
npm install
```

### 2. Update Environment Variables
```bash
npm run scripts/update-env-variables.ts
```

### 3. Replace Supabase References
```bash
npm run scripts/replace-supabase-references.ts -- --dry-run
npm run scripts/replace-supabase-references.ts
```

### 4. Manual Updates Required
- Complex queries using Supabase-specific operators
- Realtime subscriptions (use Firebase Firestore listeners instead)
- Storage bucket configurations
- Authentication middleware

### 5. Testing Checklist
- User authentication flows
- Database CRUD operations
- File upload/download
- Email notifications
- Error handling and logging

## Firebase Service Reference

### Authentication
```typescript
import { authService } from '@/app/services/firebase-service-factory';

// Sign up
await authService.signUp(email, password, name);

// Sign in  
await authService.signIn(email, password);

// Get current user
const user = await authService.getCurrentUser();
```

### Database
```typescript
import { databaseService } from '@/app/services/firebase-service-factory';

// Create
const id = await databaseService.create('lessons', lessonData);

// Query
const lessons = await databaseService.list('lessons', {
  creatorId: userId
});
```

### Storage
```typescript
import { storageService } from '@/app/services/firebase-service-factory';

// Upload
const url = await storageService.uploadFile(`avatars/${userId}`, file);

// Get URL
const downloadUrl = await storageService.getFileUrl(path);
```

### Email
```typescript
import { emailService } from '@/app/services/firebase-service-factory';

// Send welcome email
await emailService.sendWelcomeEmail(user.email, user.name);
```

## Post-Migration Tasks
1. Remove all Supabase-related environment variables
2. Delete any remaining Supabase utility files
3. Update API documentation
4. Verify monitoring and alerting
5. Perform load testing

## Support
For migration assistance, contact:
- Firebase Support: support@firebase.google.com
- Teach Niche Dev Team: dev-support@teachniche.com
