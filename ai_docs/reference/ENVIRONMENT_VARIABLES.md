# Environment Variables Reference

## Overview

This document provides a comprehensive reference for all environment variables used in the Teach Niche platform. Environment variables are used to configure the application for different environments (development, staging, production) and to store sensitive information such as API keys and credentials.

## Core Environment Variables

### Firebase Configuration

These variables are required for Firebase services and are used on both client and server:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key for client-side authentication | Client | `"AIzaSyC1a8pQ7MF9qwertyuiop1234567890"` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | Client | `"your-project-id.firebaseapp.com"` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Client/Server | `"your-project-id"` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket name | Client | `"your-project-id.appspot.com"` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Client | `"123456789012"` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase application ID | Client | `"1:123456789012:web:abcdef1234567890"` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account key (JSON) | Server | `{"type":"service_account","project_id":"your-project-id",...}` |
| `FIREBASE_AUTH_EMULATOR_HOST` | Firebase Auth emulator host (development only) | Server | `"localhost:9099"` |
| `FIREBASE_STORAGE_EMULATOR_HOST` | Firebase Storage emulator host (development only) | Server | `"localhost:9199"` |

### Google Cloud Platform

These variables are used for Google Cloud Platform services:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | Server | `"your-project-id"` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key file | Server | `"/path/to/service-account-key.json"` |
| `CLOUD_SQL_CONNECTION_NAME` | Cloud SQL instance connection name | Server | `"your-project-id:us-central1:your-instance"` |
| `GCLOUD_STORAGE_BUCKET` | GCP storage bucket name | Server | `"your-project-id-media"` |

### Database Configuration

These variables are used for database connections:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `DB_HOST` | Database host | Server | `"localhost"` or `"127.0.0.1"` (when using Cloud SQL Proxy) |
| `DB_PORT` | Database port | Server | `"5432"` |
| `DB_NAME` | Database name | Server | `"teach_niche_db"` |
| `DB_USER` | Database username | Server | `"postgres"` |
| `DB_PASSWORD` | Database password | Server | `"your-secure-password"` |
| `DB_SSL` | Whether to use SSL for database connection | Server | `"true"` |
| `DB_POOL_MIN` | Minimum number of connections in pool | Server | `"2"` |
| `DB_POOL_MAX` | Maximum number of connections in pool | Server | `"10"` |

## Payment Processing

These variables are used for Stripe integration:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Server | `"sk_test_1234567890abcdefghijklmnopqrstuvwxyz"` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Client | `"pk_test_1234567890abcdefghijklmnopqrstuvwxyz"` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Server | `"whsec_1234567890abcdefghijklmnopqrstuvwxyz"` |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Connect client ID | Server | `"ca_1234567890abcdefghijklmnopqrstuvwxyz"` |
| `PLATFORM_FEE_PERCENTAGE` | Platform fee percentage (e.g., 15%) | Server | `"15"` |

## Email and Notifications

These variables are used for email and notification services:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `EMAIL_SERVER_HOST` | SMTP server host | Server | `"smtp.gmail.com"` |
| `EMAIL_SERVER_PORT` | SMTP server port | Server | `"587"` |
| `EMAIL_SERVER_USER` | SMTP server username | Server | `"notifications@teachniche.com"` |
| `EMAIL_SERVER_PASSWORD` | SMTP server password | Server | `"your-secure-password"` |
| `EMAIL_FROM` | Default sender email address | Server | `"notifications@teachniche.com"` |
| `SUPPORT_EMAIL` | Support email address | Server | `"support@teachniche.com"` |

## Media Processing

These variables are used for media processing services:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `MUX_TOKEN_ID` | Mux API token ID | Server | `"1234567890abcdef"` |
| `MUX_TOKEN_SECRET` | Mux API token secret | Server | `"1234567890abcdefghijklmnopqrstuvwxyz"` |
| `MUX_WEBHOOK_SECRET` | Mux webhook signing secret | Server | `"1234567890abcdefghijklmnopqrstuvwxyz"` |

## Application Configuration

These variables are used for general application configuration:

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | Client/Server | `"https://teachniche.com"` |
| `NEXT_PUBLIC_API_URL` | Public URL of the API | Client | `"https://api.teachniche.com"` |
| `NEXTAUTH_URL` | NextAuth.js URL | Server | `"https://teachniche.com"` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Server | `"your-nextauth-secret"` |
| `NODE_ENV` | Node.js environment | Server | `"development"`, `"production"`, or `"test"` |
| `LOG_LEVEL` | Application logging level | Server | `"info"`, `"debug"`, `"warn"`, or `"error"` |
| `ENABLE_API_RATE_LIMITING` | Whether to enable API rate limiting | Server | `"true"` |
| `RATE_LIMIT_REQUESTS` | Number of requests allowed per window | Server | `"100"` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window in milliseconds | Server | `"60000"` |

## Environment-Specific Configuration

### Development Environment

For local development, you can use a `.env.local` file with these values:

```
# Firebase (using emulators)
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# Database (using Cloud SQL Proxy)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teach_niche_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_1234567890abcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=debug
```

### Production Environment

For production, set these environment variables in your deployment platform (Vercel, Google Cloud Run, etc.):

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
CLOUD_SQL_CONNECTION_NAME=your-project-id:us-central1:your-instance
GCLOUD_STORAGE_BUCKET=your-project-id-media

# Database
DB_NAME=teach_niche_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true

# Stripe (production mode)
STRIPE_SECRET_KEY=sk_live_1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_1234567890abcdefghijklmnopqrstuvwxyz
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz

# Application
NEXT_PUBLIC_APP_URL=https://teachniche.com
NODE_ENV=production
LOG_LEVEL=info
ENABLE_API_RATE_LIMITING=true
```

## Setting Environment Variables

### Local Development

For local development, create a `.env.local` file in the root of your project:

```bash
# Create .env.local file
cp .env.example .env.local

# Edit the file with your values
nano .env.local
```

### Vercel Deployment

For Vercel deployments, set environment variables in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each environment variable and its value
4. Specify which environments (Production, Preview, Development) should use each variable

### Google Cloud Run

For Google Cloud Run deployments, set environment variables in the deployment configuration:

```bash
gcloud run deploy SERVICE_NAME \
  --image IMAGE_URL \
  --set-env-vars="KEY1=VALUE1,KEY2=VALUE2" \
  --update-secrets="SECRET1=projects/PROJECT_ID/secrets/SECRET1:latest"
```

## Accessing Environment Variables

### In Next.js Pages and API Routes

```typescript
// Access server-side only variables in API routes or getServerSideProps
export async function getServerSideProps() {
  const dbUser = process.env.DB_USER;
  // ...
  
  return { props: { /* ... */ } };
}

// Access public variables anywhere
export default function HomePage() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  // ...
}
```

### In Other Server-Side Code

```typescript
// In any server-side code
import dotenv from 'dotenv';

// Load environment variables from .env file (development only)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};
```

## Security Considerations

1. **Never commit environment files** (`.env`, `.env.local`, etc.) to version control
2. **Use different values** for development, staging, and production environments
3. **Rotate secrets regularly**, especially for production environments
4. **Limit access** to production environment variables to authorized personnel only
5. **Use secret management services** like Google Secret Manager for production secrets
6. **Validate environment variables** at application startup to catch configuration errors early

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Environment variables not loading | Ensure `.env.local` file exists and is in the correct location |
| "Key not found" errors | Check that all required environment variables are defined |
| Values not updating | Restart the development server after changing environment variables |
| Vercel environment variables not working | Ensure they are set correctly in the Vercel dashboard and redeploy |
| Cloud Run environment variables not working | Check the deployment configuration and logs |

## Migration from Supabase

If you're migrating from Supabase to GCP, replace these environment variables:

| Supabase Variable | GCP Replacement |
|-------------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `FIREBASE_SERVICE_ACCOUNT_KEY` |
| `SUPABASE_JWT_SECRET` | `NEXTAUTH_SECRET` |
| `SUPABASE_DB_URL` | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |

## References

- [Next.js Environment Variables Documentation](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase Environment Configuration](https://firebase.google.com/docs/functions/config-env)
- [Google Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-01 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
