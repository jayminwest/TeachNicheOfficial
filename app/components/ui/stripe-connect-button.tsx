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
} from './card';
import { Badge } from './badge';
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
        <div className="bg-background border rounded-md">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Stripe Account Status</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stripeStatus?.isComplete 
                ? 'Your Stripe account is fully set up and ready to receive payments.' 
                : 'Your Stripe account setup is incomplete. Please complete the required steps.'}
            </p>
          </div>
          
          <div className="p-4">
            <div className="text-sm space-y-3">
              {/* Status indicators for all accounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <div className={`flex items-center gap-2 p-2 rounded-md ${
                  stripeStatus?.details?.has_details_submitted 
                    ? 'bg-background' 
                    : 'bg-red-50/10'
                }`}>
                  {stripeStatus?.details?.has_details_submitted 
                    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                    : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Account Details</span>
                </div>
                
                <div className={`flex items-center gap-2 p-2 rounded-md ${
                  stripeStatus?.details?.has_charges_enabled 
                    ? 'bg-background' 
                    : 'bg-red-50/10'
                }`}>
                  {stripeStatus?.details?.has_charges_enabled 
                    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                    : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Payment Processing</span>
                </div>
                
                <div className={`flex items-center gap-2 p-2 rounded-md ${
                  stripeStatus?.details?.has_payouts_enabled 
                    ? 'bg-background' 
                    : 'bg-red-50/10'
                }`}>
                  {stripeStatus?.details?.has_payouts_enabled 
                    ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                    : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Payouts Enabled</span>
                </div>
                
                <div className={`flex items-center gap-2 p-2 rounded-md ${
                  stripeStatus?.details?.pending_verification 
                    ? 'bg-amber-50/10' 
                    : (stripeStatus?.isComplete ? 'bg-background' : 'bg-background')
                }`}>
                  {stripeStatus?.details?.pending_verification 
                    ? <Clock className="h-4 w-4 text-amber-500" /> 
                    : (stripeStatus?.isComplete ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-gray-500" />)}
                  <span>Verification Status</span>
                </div>
              </div>
              
              {/* Specific status messages */}
              {stripeStatus && !stripeStatus.isComplete && (
                <>
                  {stripeStatus.details?.pendingVerification && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50/10 rounded-md text-amber-500">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Stripe is verifying your information. This may take 1-2 business days.</span>
                    </div>
                  )}
                  
                  {stripeStatus.details?.missingRequirements && 
                  stripeStatus.details.missingRequirements.length > 0 && (
                    <div className="flex items-start gap-2 p-2 bg-red-50/10 rounded-md text-red-500">
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
                </>
              )}
              
              {stripeStatus?.isComplete && (
                <div className="flex items-start gap-2 p-2 bg-green-50/10 rounded-md text-green-500">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Your Stripe account is fully verified and ready to receive payments.</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center px-4 py-2 border-t">
            <div className="text-xs text-muted-foreground">
              Account ID: {stripeAccountId?.substring(0, 8)}...
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Debug Info' : 'Show Debug Info'}
            </Button>
          </div>
          
          {showDetails && (
            <div className="px-4 pb-4">
              <div className="bg-muted/30 p-3 rounded-md text-xs font-mono overflow-x-auto">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">Debug Information:</div>
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
        </div>
      )}
      
      <Button 
        onClick={handleConnect} 
        disabled={buttonDisabled || isLoading}
        variant={buttonVariant}
        aria-busy={isLoading ? "true" : "false"}
        className="flex items-center gap-2 w-full"
      >
        {isLoading ? "Connecting..." : buttonText}
        {!buttonDisabled && !isLoading && <ExternalLink className="h-4 w-4" />}
      </Button>
    </div>
  );
}
