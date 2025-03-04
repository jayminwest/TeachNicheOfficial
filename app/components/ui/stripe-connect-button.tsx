'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { useState } from 'react';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';
import { stripeConfig } from '@/app/services/stripe';

interface StripeConnectButtonProps {
  stripeAccountId?: string | null;
  stripeStatus?: {
    isComplete: boolean;
    status: string;
    details?: {
      pendingVerification: boolean;
      missingRequirements: string[];
    };
  } | null;
}

export function StripeConnectButton({ 
  stripeAccountId,
  stripeStatus
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

      // Get user's locale and check if their country is supported
      const userLocale = navigator.language || 'en';
      const userCountry = userLocale.split('-')[1] || 'US';
      
      if (!stripeConfig.supportedCountries.includes(userCountry)) {
        throw new Error(`Sorry, Stripe is not yet supported in your country. Supported countries include: ${stripeConfig.supportedCountries.join(', ')}`);
      }

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
          locale: userLocale,
          email: user.email // Add email to payload
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = data.error || {};
        console.error('Stripe connect error:', {
          status: response.status,
          error: error,
          details: data.details
        });
        throw new Error(error.message || data.details || 'Failed to connect with Stripe');
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

  // Determine button text based on status
  let buttonText = 'Connect with Stripe';
  let buttonDisabled = false;
  let buttonVariant: 'default' | 'outline' | 'secondary' | 'destructive' = 'default';
  
  if (isLoading) {
    buttonText = 'Connecting...';
    buttonDisabled = true;
  } else if (stripeAccountId) {
    if (stripeStatus?.isComplete) {
      buttonText = 'Connected to Stripe';
      buttonDisabled = true;
      buttonVariant = 'outline';
    } else if (stripeStatus?.status === 'verification_pending') {
      buttonText = 'Verification Pending';
      buttonDisabled = false;
      buttonVariant = 'secondary';
    } else if (stripeStatus?.status === 'requirements_needed') {
      buttonText = 'Complete Stripe Setup';
      buttonDisabled = false;
      buttonVariant = 'destructive';
    } else {
      buttonText = 'Continue Stripe Setup';
      buttonDisabled = false;
      buttonVariant = 'secondary';
    }
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={buttonDisabled || isLoading}
      variant={buttonVariant}
      aria-busy={isLoading ? "true" : "false"}
    >
      {buttonText}
    </Button>
  );
}
