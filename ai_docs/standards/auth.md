# Authentication Standards

## Authentication Context

### Setup
```typescript
// services/auth/AuthContext.tsx
interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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

### Usage
```typescript
function ProtectedComponent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <SignInPrompt />

  return <ProtectedContent />
}
```

## Route Protection

### Middleware
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

### Protected Routes
```typescript
// app/dashboard/layout.tsx
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/signin')
  }

  return <div>{children}</div>
}
```

## Role-Based Access Control (RBAC)

### Role Definition
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
```

### Permission Checking
```typescript
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

## Authentication Flow

### Sign In
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

### Sign Up
```typescript
async function handleSignUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`
      }
    })

    if (error) throw error

    // Handle successful sign up
    toast.success('Check your email to confirm your account')
  } catch (error) {
    // Handle error
    toast.error('Failed to sign up')
  }
}
```

### Sign Out
```typescript
async function handleSignOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Handle successful sign out
    router.push('/')
  } catch (error) {
    // Handle error
    toast.error('Failed to sign out')
  }
}
```

## Security Measures

### Password Requirements
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
})
```

### Session Management
```typescript
// Configure session settings
supabase.auth.setSession({
  access_token,
  refresh_token
})

// Handle session refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Update session state
  }
})
```

## Error Handling

### Authentication Errors
```typescript
async function handleAuthError(error: AuthError) {
  switch (error.status) {
    case 400:
      toast.error('Invalid credentials')
      break
    case 401:
      toast.error('Please sign in again')
      await signOut()
      break
    case 429:
      toast.error('Too many attempts. Please try again later')
      break
    default:
      toast.error('An unexpected error occurred')
  }
}
```

## Testing

### Auth Mocking
```typescript
// __mocks__/auth-context.tsx
export function MockAuthProvider({ 
  user = null,
  children 
}: { 
  user?: User | null
  children: React.ReactNode 
}) {
  return (
    <AuthContext.Provider value={{
      user,
      loading: false,
      isAuthenticated: !!user,
      signIn: jest.fn(),
      signOut: jest.fn()
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Testing Protected Routes
```typescript
describe('ProtectedRoute', () => {
  it('redirects to sign in when not authenticated', () => {
    render(
      <MockAuthProvider user={null}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MockAuthProvider>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Please sign in')).toBeInTheDocument()
  })
})
```

## OAuth Integration

### Provider Setup
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
