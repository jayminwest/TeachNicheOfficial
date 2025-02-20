'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface StripeConnectButtonProps {
  stripeAccountId?: string | null;
}

export function StripeConnectButton({ 
  stripeAccountId 
}: StripeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleConnect = async () => {
    if (isLoading || !user) return;
    
    try {
      setIsLoading(true);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error('Failed to get session');
      }
      
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Initiating Stripe Connect...', { userId: user.id });
      // Add locale detection
      const userLocale = navigator.language || 'en';
      
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept-Language': userLocale
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId: user.id,
          locale: userLocale
        }),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.code === 'country_not_supported') {
          throw new Error(`Sorry, Stripe is not yet supported in your country. Supported countries include: ${errorData.supported_countries.join(', ')}`);
        }
        throw new Error(errorData.error || 'Failed to connect with Stripe');
      }

      if (!data.url) {
        throw new Error('No redirect URL received from server');
      }

      console.log('Redirecting to:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to initiate Stripe Connect:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect with Stripe. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Button variant="outline" disabled>
        Please sign in to connect Stripe
      </Button>
    );
  }

  if (stripeAccountId) {
    return (
      <Button variant="outline" disabled>
        Connected to Stripe
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isLoading}
      aria-busy={isLoading}
      role={isLoading ? 'status' : undefined}
    >
      {isLoading ? 'Connecting...' : 'Connect with Stripe'}
    </Button>
  );
}
