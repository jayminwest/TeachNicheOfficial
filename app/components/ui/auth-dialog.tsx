'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from './dialog'
import { SignInPage } from './sign-in'
import { SignUpPage } from './sign-up'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'sign-in' | 'sign-up'
}

export function AuthDialog({ open, onOpenChange, defaultView = 'sign-in' }: AuthDialogProps) {
  const [view, setView] = useState<'sign-in' | 'sign-up'>(defaultView)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        {view === 'sign-in' ? (
          <SignInPage onSwitchToSignUp={() => setView('sign-up')} />
        ) : (
          <SignUpPage onSwitchToSignIn={() => setView('sign-in')} />
        )}
      </DialogContent>
    </Dialog>
  )
}
