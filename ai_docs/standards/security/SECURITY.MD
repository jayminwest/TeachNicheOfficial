# Security Standards

## Authentication & Authorization

### Supabase Auth Implementation
- AuthContext provider from '@/app/services/auth/AuthContext'
- Protected routes via middleware
- Role-based access via Supabase RLS
- Session management with useAuth() hook
- Secure token handling and refresh

### Authentication Context

```typescript
// services/auth/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Route Protection

#### Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  return res
}
```

### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  ADMIN = 'admin'
}

interface User {
  id: string
  role: UserRole
  permissions: string[]
}

function checkPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission)
}

function RequirePermission({ 
  permission, 
  children 
}: { 
  permission: string
  children: React.ReactNode 
}) {
  const { user } = useAuth()
  
  if (!user || !checkPermission(user, permission)) {
    return <AccessDenied />
  }

  return children
}
```

### Authentication Flow

```typescript
async function handleSignIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Handle successful sign in
    router.push('/dashboard')
  } catch (error) {
    // Handle error
    toast.error('Failed to sign in')
  }
}
```

### Password Requirements
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')
```

### API Security
- Input validation with Zod
- Request rate limiting
- CORS configuration
- API key management
- Error handling

## Data Protection

### 1. Database Security
- Row Level Security (RLS)
- Data encryption
- Backup procedures
- Access logging
- Query optimization

### 2. Payment Security
- PCI compliance
- Stripe security best practices
- Webhook verification
- Error handling
- Audit logging

## Implementation Guidelines

### 1. Input Validation
```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin'])
});
```

### 2. Authentication Flow
```typescript
// Protected API route
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle request
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
```

### 3. Error Handling
```typescript
try {
  // Operation
} catch (error) {
  // Log error securely
  logger.error('Operation failed', {
    error: error.message,
    code: error.code,
    // No sensitive data
  });
  
  // Return safe error
  return {
    message: 'Operation failed',
    code: 'OPERATION_ERROR'
  };
}
```

### 4. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
})
```

### 5. OAuth Integration
```typescript
const oauthProviders = {
  google: {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: GitHubIcon,
  }
}

async function signInWithProvider(provider: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: `${location.origin}/auth/callback`
    }
  })
}
```

## Security Checklist

### Development
- [ ] Input validation
- [ ] Authentication
- [ ] Authorization
- [ ] Error handling
- [ ] Data encryption
- [ ] Secure headers
- [ ] CSRF protection
- [ ] XSS prevention

### Deployment
- [ ] Environment variables
- [ ] Secret management
- [ ] SSL/TLS setup
- [ ] Firewall rules
- [ ] Rate limiting
- [ ] Monitoring
- [ ] Logging
- [ ] Backup system

### Testing
- [ ] Security testing
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Access control testing
- [ ] Error handling testing
- [ ] Input validation testing
- [ ] Authentication testing
- [ ] Authorization testing

## Monitoring & Logging

### 1. Security Logging
```typescript
const logger = {
  error: (message: string, context: Record<string, unknown>) => {
    // Secure logging implementation
  },
  warn: (message: string, context: Record<string, unknown>) => {
    // Warning logging
  },
  audit: (message: string, context: Record<string, unknown>) => {
    // Audit logging
  }
};
```

### 2. Monitoring Setup
- Real-time alerts
- Error tracking
- Performance monitoring
- Security scanning
- Access logging
- Audit trails

## Incident Response

### 1. Response Plan
1. Detect & Alert
2. Assess Impact
3. Contain Threat
4. Investigate Cause
5. Remediate Issue
6. Review & Improve

### 2. Recovery Process
1. Backup Restoration
2. System Verification
3. Security Updates
4. Access Review
5. Documentation
6. Post-mortem

## Compliance

### 1. Standards
- GDPR compliance
- CCPA compliance
- SOC 2 requirements
- PCI DSS (if applicable)
- Local regulations

### 2. Documentation
- Security policies
- Procedures
- Incident reports
- Audit logs
- Compliance records

## Security Headers

### CSP Configuration
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `
  }
]
```
