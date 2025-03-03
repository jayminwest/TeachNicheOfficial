'use client';

import { Button } from './button';
import { signOut } from '@/app/lib/auth-helpers';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SignOutButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function SignOutButton({ 
  className,
  variant = 'outline'
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { success } = await signOut();
      
      if (success) {
        // Redirect to home page after sign out
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
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
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
