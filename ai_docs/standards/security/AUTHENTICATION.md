# Authentication Standards

This document outlines the authentication standards and best practices for the Teach Niche platform.

## Authentication Architecture

The Teach Niche platform uses Supabase Auth with Google OAuth as the primary authentication method. This architecture provides a secure, scalable, and user-friendly authentication experience.

## Key Components

### 1. Authentication Context

The `AuthContext` and `AuthProvider` (`app/services/auth/AuthContext.tsx`) serve as the central hub for authentication state management:

- Manages user state, loading state, and authentication errors
- Provides authentication status to components via the `useAuth` hook
- Handles automatic profile creation for new users
- Manages authentication state changes and redirects

### 2. Authentication Service

The authentication service (`app/services/auth/supabaseAuth.ts`) provides core authentication functions:

- `signInWithGoogle()`: Initiates the Google OAuth flow
- `signOut()`: Handles user sign-out
- `getSession()`: Retrieves the current session
- `onAuthStateChange()`: Sets up listeners for authentication state changes

### 3. UI Components

Several UI components handle the user-facing aspects of authentication:

- `AuthDialog`: Modal dialog for authentication
- `SignInPage`: Handles the sign-in process
- `SignUpPage`: Handles the sign-up process (uses the same Google OAuth flow)
- `SignOutButton`: Provides sign-out functionality

## Authentication Flow

### Sign-In Process

1. User clicks a sign-in button, which opens the `AuthDialog`
2. User selects to sign in with Google
3. User is redirected to Google's authentication page
4. After successful authentication, user is redirected back to the application
5. The `onAuthStateChange` listener detects the authentication and updates the state
6. If a user profile doesn't exist, one is automatically created
7. User is redirected based on the redirect parameter or to the profile page

### Sign-Out Process

1. User clicks the `SignOutButton`
2. The `signOut` function is called
3. Upon successful sign-out, the user is redirected to the home page
4. The `onAuthStateChange` listener detects the sign-out and updates the state

## Implementation Standards

### 1. Authentication State Access

Always use the `useAuth` hook to access authentication state:

```tsx
import { useAuth } from '@/app/services/auth/AuthContext'

function MyComponent() {
  const { user, loading, isAuthenticated, error } = useAuth()
  
  // Use these values to conditionally render content
}
```

### 2. Protected Routes

For routes that require authentication:

```tsx
'use client'

import { useAuth } from '@/app/services/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/?redirect=' + encodeURIComponent(window.location.pathname))
    }
  }, [isAuthenticated, loading, router])
  
  // Render protected content
}
```

### 3. Triggering Authentication

To open the authentication dialog:

```tsx
import { useState } from 'react'
import { AuthDialog } from '@/app/components/ui/auth-dialog'
import { Button } from '@/app/components/ui/button'

function MyComponent() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setAuthDialogOpen(true)}>
        Sign In
      </Button>
      
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          // Handle successful authentication
        }}
      />
    </>
  )
}
```

### 4. Handling Redirects

To specify a redirect URL after authentication:

```tsx
const handleAuthClick = () => {
  // Add the current page as the redirect URL
  const currentPath = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('redirect', currentPath)
  
  // Update the URL without refreshing the page
  window.history.replaceState(
    {}, 
    '', 
    `${window.location.pathname}?${searchParams.toString()}`
  )
  
  // Open the auth dialog
  setAuthDialogOpen(true)
}
```

## Security Considerations

### 1. Token Management

Supabase Auth handles token management automatically, including:
- Secure storage of tokens
- Token refresh
- Token validation

### 2. Session Handling

Sessions are managed by Supabase Auth and should not be manually manipulated.

### 3. Error Handling

Always handle authentication errors appropriately:

```tsx
const { error } = useAuth()

if (error) {
  // Display error message to user
  return <div>Authentication error: {error.message}</div>
}
```

### 4. Testing Considerations

The authentication system includes special handling for test environments:
- Mock subscriptions are returned in test environments
- A flag (`window.signInWithGoogleCalled`) is set for test detection

## Best Practices

1. **Always check authentication state** before rendering protected content
2. **Handle loading states** to provide a good user experience
3. **Provide clear error messages** when authentication fails
4. **Use the AuthDialog component** for a consistent authentication experience
5. **Implement proper redirects** to return users to their intended destination
6. **Never store sensitive authentication data** in local storage or cookies directly
7. **Use the provided hooks and components** rather than creating custom implementations

## Related Documentation

For more detailed information, refer to:
- [Authentication Guide](../../core/AUTHENTICATION.md) - Comprehensive guide to using authentication
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) - Official Supabase Auth documentation
