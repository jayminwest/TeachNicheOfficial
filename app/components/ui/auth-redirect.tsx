'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import { getRedirectUrl } from '@/app/utils/purchase-helpers';

/**
 * Component that handles redirecting users after authentication
 * if a redirect parameter is present in the URL
 */
export function AuthRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Only run after auth state has loaded and user is authenticated
    if (!loading && isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      
      if (redirectUrl) {
        // Small delay to ensure any auth state is fully processed
        const timer = setTimeout(() => {
          router.push(decodeURIComponent(redirectUrl));
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, loading, router]);
  
  // This component doesn't render anything
  return null;
}
