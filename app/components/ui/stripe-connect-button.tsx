'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { useState } from 'react';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';

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
      const result = await supabase.auth.getSession();
      if (result.error) {
        throw new Error('Failed to get session');
      }
      
      if (!result.data?.session) {
        throw new Error('No active session');
      }

      const { session } = result.data;

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
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = data.error || {};
        if (error.code === 'country_not_supported') {
          throw new Error(`Sorry, Stripe is not yet supported in your country. Supported countries include: ${data.supported_countries?.join(', ') || 'none'}`);
        }
        throw new Error(error.message || 'Failed to connect with Stripe');
      }

      if (!data.url) {
        throw new Error('No redirect URL received from server');
      }

      window.location.href = data.url;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect with Stripe. Please try again.',
      });
      setIsLoading(false); // Only reset loading on error
    }
  };

  if (!user) {
    return (
      <Button 
        variant="outline" 
        disabled
      >
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
      aria-busy={isLoading ? "true" : "false"}
    >
      {isLoading ? 'Connecting...' : 'Connect with Stripe'}
    </Button>
  );
}
