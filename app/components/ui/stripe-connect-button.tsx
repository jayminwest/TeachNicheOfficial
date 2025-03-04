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
    console.log('handleConnect called, user:', user?.id);
    if (isLoading || !user) {
      console.log('Aborting connect - loading:', isLoading, 'user:', !!user);
      return;
    }
    
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

      console.log('Initiating Stripe Connect with user:', user.id);
      
      console.log('Sending request to /api/stripe/connect');
      
      // First check if we can connect to Stripe
      const testResponse = await fetch('/api/stripe/test');
      if (!testResponse.ok) {
        throw new Error('Stripe API connection test failed. Please try again later.');
      }
      
      // Add a debug log for the request body
      const requestBody = { 
        userId: user.id,
        locale: userLocale,
        email: user.email
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept-Language': userLocale
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('Stripe connect response error:', data);
        throw new Error(data.error || data.details || 'Failed to connect with Stripe');
      }

      console.log('Received data:', data);
      
      if (!data.url) {
        console.error('No URL in response:', data);
        throw new Error('No redirect URL received from server');
      }

      console.log('Redirecting to:', data.url);
      
      // Show a toast before redirecting
      toast({
        title: 'Redirecting to Stripe',
        description: 'You will be redirected to Stripe to complete the setup process.',
      });
      
      // Use setTimeout to ensure the toast is shown before redirect
      setTimeout(() => {
        // Try different redirect methods
        try {
          console.log('Attempting redirect with window.location.href');
          window.location.href = data.url;
        } catch (e) {
          console.error('Redirect with href failed, trying assign:', e);
          window.location.assign(data.url);
        }
      }, 1000);
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
    console.log('No user found in StripeConnectButton');
    return (
      <Button 
        variant="outline" 
        disabled
      >
        Please sign in to connect Stripe
      </Button>
    );
  }

  // Add debug function
  const testStripeApi = async () => {
    try {
      const response = await fetch('/api/stripe/test');
      const data = await response.json();
      console.log('Stripe API test result:', data);
      toast({
        title: data.status === 'ok' ? 'Stripe API Connected' : 'Stripe API Error',
        description: data.message,
        variant: data.status === 'ok' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Stripe API test error:', error);
      toast({
        title: 'Stripe API Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

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

  // Add debug function for config
  const debugStripeConfig = async () => {
    try {
      const response = await fetch('/api/stripe/debug');
      const data = await response.json();
      console.log('Stripe config:', data);
      toast({
        title: 'Stripe Configuration',
        description: `Connect Type: ${data.config.connectType}, API Version: ${data.config.apiVersion}`,
      });
    } catch (error) {
      console.error('Stripe config debug error:', error);
      toast({
        title: 'Config Debug Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Add direct test link function
  const testDirectLink = async () => {
    try {
      const response = await fetch('/api/stripe/test-link');
      const data = await response.json();
      console.log('Test link result:', data);
      
      if (data.success && data.url) {
        toast({
          title: 'Test Link Created',
          description: 'Redirecting to Stripe test link...',
        });
        
        // Use setTimeout to ensure the toast is shown before redirect
        setTimeout(() => {
          window.location.href = data.url;
        }, 1000);
      } else {
        toast({
          title: 'Test Link Failed',
          description: data.error || 'Failed to create test link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test link error:', error);
      toast({
        title: 'Test Link Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handleConnect} 
        disabled={buttonDisabled || isLoading}
        variant={buttonVariant}
        aria-busy={isLoading ? "true" : "false"}
      >
        {isLoading ? "Connecting..." : buttonText}
      </Button>
      
      {process.env.NODE_ENV !== 'production' && (
        <div className="flex flex-col gap-1">
          <Button 
            onClick={testStripeApi} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            Test Stripe API
          </Button>
          <Button 
            onClick={debugStripeConfig} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            Debug Stripe Config
          </Button>
          <Button 
            onClick={testDirectLink} 
            variant="outline" 
            size="sm"
            className="text-xs bg-green-100"
          >
            Test Direct Link
          </Button>
        </div>
      )}
    </div>
  );
}
