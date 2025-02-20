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
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe');
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to initiate Stripe Connect:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to connect with Stripe. Please try again.',
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
