# Password Reset Component Implementation

This document provides a sample implementation of the password reset component that will be needed for the email authentication feature.

## Password Reset Request Component

```tsx
// app/components/ui/password-reset-request.tsx
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/app/lib/supabase-client'
import { Button } from '@/app/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Loader2 } from 'lucide-react'

const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type PasswordResetValues = z.infer<typeof passwordResetSchema>

interface PasswordResetRequestProps {
  onSuccess?: () => void
  onCancel: () => void
}

export function PasswordResetRequest({ onSuccess, onCancel }: PasswordResetRequestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const form = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: PasswordResetValues) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const { error } = await firebaseAuth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Check your email for a password reset link',
      })
      
      if (onSuccess) {
        setTimeout(onSuccess, 3000)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send password reset email',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Reset Password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    {...field} 
                    data-testid="password-reset-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
```

## Password Reset Confirmation Component

```tsx
// app/components/ui/password-reset-confirmation.tsx
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase-client'
import { Button } from '@/app/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Loader2 } from 'lucide-react'

const passwordResetSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordResetValues = z.infer<typeof passwordResetSchema>

export function PasswordResetConfirmation() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const form = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    // Check if we have the access token in the URL
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    if (!params.get('access_token')) {
      setMessage({
        type: 'error',
        text: 'Invalid or expired reset link. Please request a new password reset.',
      })
    }
  }, [])

  const onSubmit = async (values: PasswordResetValues) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const { error } = await firebaseAuth.updateUser({
        password: values.password,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting to login...',
      })
      
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error) {
      console.error('Password update error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update password',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Create New Password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    data-testid="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    data-testid="confirm-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !!message?.type === 'success'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
```

## Integration with Auth Dialog

To integrate the password reset functionality with the existing auth dialog, you'll need to:

1. Add a "Forgot password?" link to the sign-in component
2. Add a new view state to the auth dialog for password reset
3. Update the auth dialog to handle the password reset flow

Example modification to the auth dialog:

```tsx
// Partial example showing how to integrate with auth-dialog.tsx
interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'sign-in' | 'sign-up' | 'password-reset'
}

export function AuthDialog({ open, onOpenChange, defaultView = 'sign-in' }: AuthDialogProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up' | 'password-reset'>(defaultView)
  
  // ...existing code...
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        {view === 'sign-in' && (
          <SignIn 
            onSwitchToSignUp={() => setView('sign-up')} 
            onForgotPassword={() => setView('password-reset')}
          />
        )}
        {view === 'sign-up' && (
          <SignUp onSwitchToSignIn={() => setView('sign-in')} />
        )}
        {view === 'password-reset' && (
          <PasswordResetRequest 
            onCancel={() => setView('sign-in')}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
```

## Reset Password Page

Create a dedicated page for handling password reset confirmations:

```tsx
// app/reset-password/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { PasswordResetConfirmation } from '@/app/components/ui/password-reset-confirmation'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [hasToken, setHasToken] = useState(false)
  
  useEffect(() => {
    // Check if we have the access token in the URL
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    setHasToken(!!params.get('access_token'))
  }, [])
  
  if (!hasToken) {
    return (
      <div className="container mx-auto max-w-md py-24 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Invalid or expired password reset link. Please request a new password reset.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto max-w-md py-24 px-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <PasswordResetConfirmation />
      </div>
    </div>
  )
}
```

## Testing Considerations

When implementing these components, be sure to test:

1. Password reset request with valid and invalid emails
2. Password reset token validation
3. Password update with valid and invalid passwords
4. Error handling for all scenarios
5. Redirect flows after successful operations
6. Mobile responsiveness of all UI components

Add appropriate end-to-end tests using Playwright to verify the complete password reset flow.
