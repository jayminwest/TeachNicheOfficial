'use client';

import { Button } from './button';
import { signOut } from '@/app/services/auth/supabaseAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SignOutButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function SignOutButton({ 
  className,
  variant = 'default'
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(false);
      const { success, error } = await signOut();
      
      if (success) {
        // Redirect to home page after sign out
        router.push('/');
      } else if (error) {
        console.error('Error signing out:', error.message);
        setError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
      data-testid="sign-out-button"
    >
      {isLoading ? 'Signing out...' : error ? 'Error' : 'Sign out'}
    </Button>
  );
}
