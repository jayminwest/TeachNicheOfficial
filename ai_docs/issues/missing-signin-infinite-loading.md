# Issue: Missing Sign In Button and Infinite Loading States After Client/Server Component Split

## Problem Description

After launching the site, we've encountered two critical issues that need immediate attention:

1. **Missing Sign In Button**: The Sign In button is not appearing in the header, preventing users from accessing authentication functionality.

2. **Infinite Loading States**: Multiple pages are stuck in infinite loading states, including:
   - Lessons page
   - Requests page
   - Auth/Sign In pages

## Technical Analysis

### 1. Missing Sign In Button Issue

The header component (`app/components/ui/header.tsx`) contains the Sign In button code, but it's not appearing on the site. The button is conditionally rendered based on the `loading` and `user` states from the `useAuth()` hook:

```tsx
{!loading && user ? (
    // User profile and sign out buttons
) : !loading ? (
    <>
        <AuthDialog 
            open={dialogOpen} 
            onOpenChange={setDialogOpen}
            defaultView={showSignIn ? 'sign-in' : 'sign-up'}
        />
        <Button 
            variant="ghost" 
            onClick={() => setDialogOpen(true)}
            data-testid="sign-in-button"
        >
            Sign In
        </Button>
    </>
) : null}
```

After examining the `AuthContext.tsx` and `providers.tsx` files, I've identified potential causes:

- The `AuthProvider` in `app/services/auth/AuthContext.tsx` might be encountering issues during initialization, causing the `loading` state to remain true
- The `suppressHydrationWarning` attributes in `providers.tsx` and `layout.tsx` suggest there might be hydration mismatches affecting client-side rendering
- The auth state change listener might not be properly handling auth state transitions

### 2. Infinite Loading States Issue

We've implemented a client/server component split to bypass `useSearchParams()` errors during build. This approach uses:

1. Static server components (`force-static`) for the initial page load
2. Client-side JavaScript loading via `dangerouslySetInnerHTML` to inject scripts
3. Separate client components loaded after the page loads

For example, in `app/lessons/page.tsx`:
```jsx
<script dangerouslySetInnerHTML={{ 
  __html: `
    // Load the actual lessons content after page loads
    document.addEventListener('DOMContentLoaded', function() {
      const script = document.createElement('script');
      script.src = '/lessons-client.js';
      script.async = true;
      document.body.appendChild(script);
    });
  `
}} />
```

The specific issues appear to be:

- The client scripts are being loaded, but they may not have access to the necessary context providers
- The `AuthProvider` from `app/services/auth/AuthContext.tsx` is only available to components within the React tree, but not to dynamically loaded scripts
- The `DOMContentLoaded` event might be firing before React has fully hydrated the page
- The client scripts might be encountering errors during initialization that aren't being properly caught or logged

## Steps to Reproduce

1. Visit the site
2. Observe the header - the Sign In button is missing
3. Navigate to any of the following pages:
   - `/lessons`
   - `/requests`
   - `/auth`
4. Observe that these pages remain in loading states indefinitely (showing loading spinners or skeleton UI)

## Expected Behavior

1. The Sign In button should be visible in the header for unauthenticated users
2. All pages should load properly and display their content without getting stuck in loading states

## Files Needing Updates

1. **Authentication Flow**:
   - `app/components/ui/header.tsx` - Fix Sign In button rendering
   - `app/services/auth/AuthContext.tsx` - Fix auth state management issues:
     ```tsx
     // Current implementation has potential issues with state transitions
     useEffect(() => {
       let isMounted = true
       let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} }

       // Check active sessions and sets the user
       async function initializeAuth() {
         try {
           // Get initial session
           const { data: { session } } = await getSession()
           
           if (session?.user && isMounted) {
             setUser(session.user)
             // Handle profile creation in a separate service
             await createOrUpdateProfile(session.user)
           }
           
           if (isMounted) {
             setLoading(false)
           }
           // ...
     ```
   - `app/components/providers.tsx` - Ensure providers are properly initialized:
     ```tsx
     export function Providers({ children, ...props }: ThemeProviderProps) {
       // Use suppressHydrationWarning on the wrapper div
       return (
         <div suppressHydrationWarning>
           <NextThemesProvider {...props}>
             <AuthProvider>
               {children}
             </AuthProvider>
           </NextThemesProvider>
         </div>
       )
     }
     ```

2. **Client Script Loading**:
   - `app/lessons/page.tsx`, `app/requests/page.tsx`, `app/auth/page.tsx` - Fix client script loading approach
   - `public/lessons-client.js`, `public/requests-client.js`, `public/auth-client.js` - Ensure these scripts properly initialize with required context

3. **Layout and Hydration**:
   - `app/layout.tsx` - Address hydration issues with `suppressHydrationWarning`

## Proposed Solution

1. **Fix Authentication Context**:
   - Add error handling and logging to the `AuthContext.tsx` initialization
   - Ensure the `loading` state is properly updated even if there are errors
   - Consider adding a timeout to force the loading state to false after a certain period

2. **Fix Sign In Button**:
   - Add debugging to determine why the button isn't rendering
   - Consider adding a fallback rendering option that doesn't depend on the auth state

3. **Fix Client/Server Component Split**:
   - Replace the current script injection approach with Next.js's built-in solutions:
     ```tsx
     // Instead of script injection, use dynamic imports
     import dynamic from 'next/dynamic'
     
     const LessonsClient = dynamic(() => import('./lessons-client'), {
       ssr: false,
       loading: () => <LoadingSpinner />
     })
     
     export default function LessonsPage() {
       return (
         <div>
           <h1>Lessons</h1>
           <LessonsClient />
         </div>
       )
     }
     ```

4. **Implement Proper Error Boundaries**:
   - Add React Error Boundary components around critical sections to prevent infinite loading
   - Add timeouts to loading states to ensure they don't get stuck indefinitely

## Priority

High - These issues are blocking core functionality of the site and preventing users from signing in or accessing content.

## Additional Context

The current approach of using `force-static` and client script injection was implemented as a workaround for `useSearchParams()` errors during build. While this approach can work, it introduces complexity in maintaining the React component lifecycle and context providers. A more sustainable solution would be to use Next.js's built-in mechanisms for client/server component splitting.
