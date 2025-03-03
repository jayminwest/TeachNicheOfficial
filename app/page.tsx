'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Hero } from "@/app/components/ui/animated-hero";
import { Features } from "@/app/components/ui/features";
import { EmailSignup } from "@/app/components/ui/email-signup";
import { AuthDialog } from "@/app/components/ui/auth-dialog";

export default function Home() {
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
    <div className="flex flex-col">
      <div className="flex flex-col items-center justify-center p-8 min-h-[600px]" data-testid="hero-section-container">
        <Hero />
      </div>
      <Features />
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-16">
        <EmailSignup />
      </div>
      
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
    </div>
  );
}
