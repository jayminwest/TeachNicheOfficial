'use client'

import { useEffect, useState } from 'react'
import { AuthDialog } from "@/app/components/ui/auth-dialog";

export default function HomeClient() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('/profile')
  
  useEffect(() => {
    // Check if we should show the auth dialog
    const urlParams = new URLSearchParams(window.location.search);
    const showAuth = urlParams.get('auth') === 'signin'
    const redirect = urlParams.get('redirect')
    
    if (showAuth) {
      setAuthDialogOpen(true)
    }
    
    if (redirect) {
      setRedirectUrl(redirect)
    }
  }, [])
  
  // Helper method that can be mocked in tests
  redirectTo(url: string) {
    window.location.href = url
  }
  
  return (
    <>
      {/* Auth dialog that will open automatically when auth=signin */}
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          // Navigate to the redirect URL after successful auth
          this.redirectTo(redirectUrl)
        }}
      />
    </>
  );
}
