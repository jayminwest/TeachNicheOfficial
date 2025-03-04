'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { useState } from 'react';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';
import { stripeConfig } from '@/app/services/stripe';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

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
  const [showDetails, setShowDetails] = useState(false);
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
      
      // Show a toast before redirecting
      toast({
        title: 'Connecting to Stripe',
        description: 'Redirecting to Stripe account setup...',
      });
      
      // Use the direct redirect approach that works
      window.location.href = '/api/stripe/direct-redirect';
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

  // Get status badge and icon
  const getStatusBadge = () => {
    if (!stripeAccountId) return null;
    
    let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'default';
    let icon = <CheckCircle className="h-4 w-4 mr-1" />;
    let label = 'Connected';
    
    if (!stripeStatus?.isComplete) {
      if (stripeStatus?.status === 'verification_pending') {
        variant = 'secondary';
        icon = <Clock className="h-4 w-4 mr-1" />;
        label = 'Verification Pending';
      } else if (stripeStatus?.status === 'requirements_needed') {
        variant = 'destructive';
        icon = <AlertCircle className="h-4 w-4 mr-1" />;
        label = 'Action Required';
      } else {
        variant = 'secondary';
        icon = <AlertTriangle className="h-4 w-4 mr-1" />;
        label = 'Setup Incomplete';
      }
    }
    
    return (
      <Badge variant={variant} className="flex items-center">
        {icon} {label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {stripeAccountId && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Stripe Account Status</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>
              {stripeStatus?.isComplete 
                ? 'Your Stripe account is fully set up and ready to receive payments.' 
                : 'Your Stripe account setup is incomplete. Please complete the required steps.'}
            </CardDescription>
          </CardHeader>
          
          {stripeStatus && !stripeStatus.isComplete && (
            <CardContent className="pt-0">
              <div className="text-sm space-y-2">
                {stripeStatus.details?.pendingVerification && (
                  <div className="flex items-start gap-2 text-amber-600">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Stripe is verifying your information. This may take 1-2 business days.</span>
                  </div>
                )}
                
                {stripeStatus.details?.missingRequirements && 
                 stripeStatus.details.missingRequirements.length > 0 && (
                  <div className="flex items-start gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Required information missing:</p>
                      <ul className="list-disc pl-5 mt-1">
                        {stripeStatus.details.missingRequirements.map((req, i) => (
                          <li key={i}>{req.replace(/_/g, ' ').replace(/\./g, ' › ')}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
          
          <CardFooter className="flex justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Account ID: {stripeAccountId?.substring(0, 8)}...
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </CardFooter>
          
          {showDetails && (
            <div className="px-6 pb-4">
              <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify({
                    accountId: stripeAccountId,
                    status: stripeStatus?.status || 'unknown',
                    isComplete: stripeStatus?.isComplete || false,
                    details: stripeStatus?.details || {},
                  }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>
      )}
      
      <Button 
        onClick={handleConnect} 
        disabled={buttonDisabled || isLoading}
        variant={buttonVariant}
        aria-busy={isLoading ? "true" : "false"}
        className="flex items-center gap-2"
      >
        {isLoading ? "Connecting..." : buttonText}
        {!buttonDisabled && !isLoading && <ExternalLink className="h-4 w-4" />}
      </Button>
    </div>
  );
}
