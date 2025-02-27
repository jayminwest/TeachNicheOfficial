# Authentication Standards

This document outlines security standards and best practices for authentication in the Teach Niche platform.

## Core Principles
1. All authentication must use Firebase Authentication
2. Passwordless authentication preferred where possible
3. Multi-factor authentication (MFA) required for admin accounts
4. Session tokens valid for maximum 24 hours
5. All auth operations must be logged

## Firebase Authentication Setup
```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

## Password Requirements
- Minimum length: 12 characters
- Require mix of: uppercase, lowercase, numbers, symbols
- Maximum password age: 90 days
- Password history: 5 previous passwords remembered
- Account lockout: 5 failed attempts → 15 minute lock

## Session Management
```typescript
// Custom session handling example
import { browserSessionPersistence, setPersistence } from 'firebase/auth';

const sessionConfig = {
  persistence: browserSessionPersistence,
  tokenRefreshInterval: 3600 // 1 hour
};

setPersistence(auth, sessionConfig.persistence);
```

## Multi-Factor Authentication
Required for:
- Admin users
- Users with payment methods stored
- Users accessing sensitive data

Implementation:
```typescript
import { multiFactor } from 'firebase/auth';

// Enroll MFA
const enrollMFA = async (user) => {
  const mfaSession = await multiFactor(user).getSession();
  
  // Present QR code to user
  const totpSecret = await multiFactor(user).enroll({
    factorId: multiFactor.TOTP,
    displayName: user.email,
    session: mfaSession
  });
};
```

## Audit Requirements
1. Log all authentication attempts (success/failure)
2. Record IP address and user agent
3. Store logs in Cloud Logging with 1-year retention
4. Alert on suspicious patterns:
   - Multiple failed attempts
   - Geographic anomalies
   - New device logins

## Social Auth Requirements
- Google and Apple providers only
- Require verified email
- Additional scopes require approval
- Token validation must check both:
  ```typescript
  await validateFirebaseIdToken(idToken);
  await verifyAppleToken(appleCredential);
  ```

## Error Handling Standards
- Generic error messages (no system details)
- Rate limiting headers on auth endpoints
- Secure cookie attributes:
  ```ini
  HttpOnly=true
  SameSite=Strict
  Secure=true
  Max-Age=86400
  ```

## Password Reset Flow
1. Send reset link via Google Workspace SMTP
2. Link valid for 1 hour
3. Requires re-authentication for sensitive operations
4. Post-reset notification email

## Security Headers
All auth endpoints must include:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Third-Party Integration
1. All external auth providers must use OAuth 2.0
2. JWT validation must check:
   - Signature
   - Issuer
   - Expiration
   - Audience
3. Token binding required for sensitive operations

## Compliance
- GDPR Article 32 requirements
- CCPA data protection standards
- PCI DSS for payment-related auth
- Weekly security scans
- Quarterly penetration tests
