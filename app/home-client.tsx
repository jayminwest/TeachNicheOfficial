'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthDialog } from "@/app/components/ui/auth-dialog";

export default function HomeClient() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check if we should show the auth dialog
    const showAuth = searchParams?.get('auth') === 'signin'
    if (showAuth) {
      setAuthDialogOpen(true)
    }
  }, [searchParams])
  
  return (
    <>
      {/* Auth dialog that will open automatically when auth=signin */}
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          // Get the redirect parameter if it exists
          const redirectTo = searchParams?.get('redirect') || '/profile'
          // Navigate to the redirect URL after successful auth
          window.location.href = redirectTo
        }}
      />
    </>
  );
}
