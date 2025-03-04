# Admin Dashboard Implementation

## Description
We need to create a secure admin dashboard that is only accessible to users with admin privileges. This dashboard will provide essential monitoring, debugging tools, and system statistics to help maintain and troubleshoot the Teach Niche platform.

## Technical Analysis
The implementation will require:

1. **Authentication & Authorization**:
   - Extend the database schema to include admin role information
   - Create an admin middleware guard that builds on the existing middleware
   - Implement a specialized `useAdminGuard` hook based on the existing `useAuthGuard`

2. **Admin Dashboard UI**:
   - Create a dedicated admin layout that extends the main layout
   - Implement a sidebar navigation for admin-specific features
   - Use existing UI components for consistency with the main application

3. **Core Features**:
   - **Service Status Monitoring**: Real-time status checks for Supabase, Stripe, and Mux
   - **Debug Routes**: Consolidated access to existing debug endpoints
   - **System Statistics**: User counts, lesson metrics, revenue data
   - **Database Management**: Direct access to view and modify critical data
   - **User Management**: Tools to manage user roles and access

## Implementation Details

### Database Schema Updates
```sql
-- Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create admin_logs table for audit trail
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Middleware Extension
Extend the existing middleware to protect admin routes:

```typescript
// In middleware.ts
const ADMIN_PATHS = [
  '/admin',
  '/admin/users',
  '/admin/stats',
  '/admin/debug',
  '/api/admin'
]

// Add to middleware function
if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
  // Get the session using the middleware client
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()
  
  if (!profile?.is_admin) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
```

### Admin Guard Hook
Create a specialized hook for admin routes:

```typescript
// app/hooks/use-admin-guard.ts
import { useAuth } from '@/app/services/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/app/components/ui/use-toast'
import { createClientSupabaseClient } from '@/app/lib/supabase/client'

export function useAdminGuard(options = {}) {
  const { 
    redirectTo = '/',
    showToast = true,
    toastMessage = 'You do not have admin privileges',
    onUnauthorized
  } = options
  
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)
  
  useEffect(() => {
    async function checkAdminStatus() {
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setAdminLoading(false)
        return
      }
      
      try {
        const supabase = createClientSupabaseClient()
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        setIsAdmin(!!profile?.is_admin)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setAdminLoading(false)
      }
    }
    
    if (!loading) {
      checkAdminStatus()
    }
  }, [user, isAuthenticated, loading])
  
  useEffect(() => {
    if (!adminLoading && !isAdmin && !loading) {
      if (showToast) {
        toast({
          title: 'Admin Access Required',
          description: toastMessage,
          variant: 'destructive',
        })
      }
      
      if (redirectTo) {
        router.push(redirectTo)
      }
      
      if (onUnauthorized) {
        onUnauthorized()
      }
    }
  }, [isAdmin, adminLoading, loading, redirectTo, router, showToast, toastMessage, onUnauthorized])
  
  return {
    isAdmin,
    loading: loading || adminLoading,
    user
  }
}
```

### Admin API Routes
Create base admin API routes:

```typescript
// app/api/admin/status/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase/server'
import { getStripe } from '@/app/services/stripe'
import { Video } from '@mux/mux-node'

export async function GET() {
  try {
    // Check admin status
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check services status
    const services = {
      supabase: { status: 'unknown' },
      stripe: { status: 'unknown' },
      mux: { status: 'unknown' }
    }
    
    // Check Supabase
    try {
      const { data, error } = await supabase.from('profiles').select('count')
      services.supabase.status = error ? 'error' : 'operational'
      services.supabase.details = error ? error.message : `${data[0].count} profiles`
    } catch (e) {
      services.supabase.status = 'error'
      services.supabase.details = e instanceof Error ? e.message : 'Unknown error'
    }
    
    // Check Stripe
    try {
      const stripe = getStripe()
      const balance = await stripe.balance.retrieve()
      services.stripe.status = 'operational'
      services.stripe.details = `Available: ${balance.available.length} currencies`
    } catch (e) {
      services.stripe.status = 'error'
      services.stripe.details = e instanceof Error ? e.message : 'Unknown error'
    }
    
    // Check Mux
    try {
      if (Video) {
        const assets = await Video.Assets.list({ limit: 1 })
        services.mux.status = 'operational'
        services.mux.details = `API accessible`
      } else {
        services.mux.status = 'warning'
        services.mux.details = 'Mux client not initialized'
      }
    } catch (e) {
      services.mux.status = 'error'
      services.mux.details = e instanceof Error ? e.message : 'Unknown error'
    }
    
    return NextResponse.json({ services })
  } catch (error) {
    console.error('Admin status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check services status' },
      { status: 500 }
    )
  }
}
```

### Admin Dashboard UI
Create the main admin dashboard page:

```typescript
// app/admin/page.tsx
'use client'

import { useAdminGuard } from '@/app/hooks/use-admin-guard'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Skeleton } from '@/app/components/ui/skeleton'
import { CheckCircle, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminDashboard() {
  const { isAdmin, loading } = useAdminGuard()
  const [servicesStatus, setServicesStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  
  useEffect(() => {
    async function fetchServicesStatus() {
      try {
        const response = await fetch('/api/admin/status')
        const data = await response.json()
        setServicesStatus(data.services)
      } catch (error) {
        console.error('Failed to fetch services status:', error)
      } finally {
        setStatusLoading(false)
      }
    }
    
    if (isAdmin) {
      fetchServicesStatus()
    }
  }, [isAdmin])
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return null // The hook will handle redirection
  }
  
  const refreshStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await fetch('/api/admin/status')
      const data = await response.json()
      setServicesStatus(data.services)
    } catch (error) {
      console.error('Failed to refresh services status:', error)
    } finally {
      setStatusLoading(false)
    }
  }
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Operational</Badge>
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={refreshStatus} disabled={statusLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="status">
        <TabsList className="mb-6">
          <TabsTrigger value="status">Service Status</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="debug">Debug Tools</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusLoading ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : servicesStatus ? (
              Object.entries(servicesStatus).map(([service, data]) => (
                <Card key={service}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="capitalize">{service}</CardTitle>
                    {getStatusBadge(data.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(data.status)}
                      <span>{data.details || 'No details available'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load services status
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>Key metrics about platform usage</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Statistics content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Tools</CardTitle>
              <CardDescription>Tools for testing and troubleshooting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => window.open('/api/debug/mux-upload', '_blank')}>
                  Mux Upload Debug
                </Button>
                <Button variant="outline" onClick={() => window.open('/api/stripe/test', '_blank')}>
                  Stripe API Test
                </Button>
                <Button variant="outline" onClick={() => window.open('/api/stripe/debug', '_blank')}>
                  Stripe Config Debug
                </Button>
                <Button variant="outline" onClick={() => window.open('/api/auth/verify-config', '_blank')}>
                  Auth Config Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and access</CardDescription>
            </CardHeader>
            <CardContent>
              <p>User management interface will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Admin Layout
Create a dedicated layout for admin pages:

```typescript
// app/admin/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Teach Niche',
  description: 'Administrative tools and monitoring for Teach Niche platform',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 container mx-auto">
        {children}
      </div>
    </div>
  )
}
```

## Affected Files
- New files:
  - `app/admin/page.tsx` - Main admin dashboard
  - `app/admin/layout.tsx` - Admin layout
  - `app/hooks/use-admin-guard.ts` - Admin authorization hook
  - `app/api/admin/status/route.ts` - Service status API
  - `app/api/admin/stats/route.ts` - Statistics API
  - `app/api/admin/users/route.ts` - User management API

- Modified files:
  - `middleware.ts` - Add admin route protection
  - `types/database.ts` - Add is_admin field to profiles table

## Testing Requirements
- Verify admin-only access works correctly
  - Test with admin user (should have access)
  - Test with non-admin user (should be redirected)
  - Test with unauthenticated user (should be redirected)
- Test all dashboard features function as expected
  - Service status checks
  - Debug tools access
  - Statistics display
- Ensure proper error handling for unauthorized access attempts
- Confirm responsive design works on all device sizes

## Security Considerations
- Implement strict server-side validation for all admin routes
- Add rate limiting for admin API endpoints
- Log all admin actions for audit purposes
- Ensure sensitive data is properly protected
- Use proper RBAC (Role-Based Access Control)

## Additional Context
This admin dashboard is critical for platform maintenance but should be completely inaccessible to regular users. The initial implementation should focus on essential monitoring and debugging tools, with the ability to expand functionality in the future.

## Acceptance Criteria
- [ ] Admin dashboard is only accessible to users with admin privileges
- [ ] Dashboard displays service status for all integrated services (Supabase, Stripe, Mux)
- [ ] System statistics show key metrics about platform usage
- [ ] Debug tools allow for testing and troubleshooting
- [ ] UI is consistent with the rest of the application
- [ ] All admin actions are properly logged
- [ ] Responsive design works on all device sizes
