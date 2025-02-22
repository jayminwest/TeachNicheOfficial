# Environment Configuration Standards

## Environment Variables

### Required Variables
```bash
# Authentication
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Mux
MUX_TOKEN_ID=your-token-id
MUX_TOKEN_SECRET=your-token-secret
NEXT_PUBLIC_MUX_ENV_KEY=your-env-key

# General
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=development
```

### Configuration Management
```typescript
// lib/config.ts
import { z } from 'zod'

const envSchema = z.object({
  // Auth
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  
  // Mux
  MUX_TOKEN_ID: z.string().min(1),
  MUX_TOKEN_SECRET: z.string().min(1),
  NEXT_PUBLIC_MUX_ENV_KEY: z.string().min(1),
  
  // App
  NEXT_PUBLIC_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

export type Env = z.infer<typeof envSchema>;

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    )
    throw new Error('Invalid environment variables')
  }
}
```

## Development Setup

### Local Environment
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
# ... other variables
```

### Test Environment
```bash
# .env.test
NODE_ENV=test
NEXT_PUBLIC_URL=http://localhost:3000
# Use test API keys
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_URL=https://your-domain.com
# Use production API keys
```

## Environment Templates

### Template File
```bash
# .env.template
# Authentication
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Configuration
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Mux Video
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
NEXT_PUBLIC_MUX_ENV_KEY=

# Application
NEXT_PUBLIC_URL=http://localhost:3000
NODE_ENV=development
```

## Security

### Environment Protection
- Never commit .env files
- Use .gitignore properly
- Rotate secrets regularly
- Use environment-specific keys

### Access Control
- Limit access to production secrets
- Use secret rotation
- Implement proper logging
- Monitor for exposure

## Deployment

### Vercel Configuration
- Set environment variables in Vercel dashboard
- Use preview environment variables
- Enable branch-specific variables
- Monitor variable usage

### CI/CD Setup
- Set CI/CD environment variables
- Use GitHub secrets
- Implement proper validation
- Monitor deployments

## Testing

### Environment Setup
```typescript
// setup-test-env.ts
import { loadEnvConfig } from '@next/env'

export default async function setupTestEnv() {
  const projectDir = process.cwd()
  loadEnvConfig(projectDir)
}
```

### Test Configuration
```typescript
describe('Environment', () => {
  it('validates required variables', () => {
    expect(() => validateEnv()).not.toThrow()
  })
})
```

## Documentation

### Setup Guide
1. Copy .env.template to .env.local
2. Fill in required variables
3. Validate configuration
4. Start development server

### Troubleshooting
- Common issues
- Variable validation
- Missing variables
- Invalid formats

## Monitoring

### Environment Checks
```typescript
function checkEnvironment() {
  // Validate required variables
  validateEnv()
  
  // Check API connections
  checkSupabaseConnection()
  checkStripeConnection()
  checkMuxConnection()
  
  console.log('✅ Environment validated')
}
```

### Error Tracking
```typescript
function logEnvironmentError(error: Error, context?: Record<string, unknown>) {
  logger.error('Environment error:', {
    error: error.message,
    code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    context,
    timestamp: new Date().toISOString()
  })
}
```
