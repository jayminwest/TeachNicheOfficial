'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface StripeConnectButtonProps {
  stripeAccountId?: string | null;
}

export function StripeConnectButton({ stripeAccountId }: StripeConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('Initiating Stripe Connect...');
      
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe');
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

  if (stripeAccountId) {
    return (
      <Button variant="outline" disabled>
        Connected with Stripe
      </Button>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading}>
      {isLoading ? 'Connecting...' : 'Connect with Stripe'}
    </Button>
  );
}
