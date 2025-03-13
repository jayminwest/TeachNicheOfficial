'use client';

import { useState, useEffect } from 'react';
import { StripeAccountStatus } from '../ui/stripe-account-status';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

export function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeData, setStripeData] = useState<{
    connected: boolean;
    stripeAccountId?: string;
    isComplete?: boolean;
    status?: string;
    details?: {
      pendingVerification?: boolean;
      missingRequirements?: string[];
    };
  }>({
    connected: false
  });

  useEffect(() => {
    const fetchStripeStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stripe/connect/status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Stripe status');
        }
        
        const data = await response.json();
        setStripeData(data);
      } catch (error) {
        console.error('Error fetching Stripe status:', error);
        setError('Failed to load Stripe account status');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStripeStatus();
  }, []);

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create Stripe account');
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      setError('Failed to connect Stripe account');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-red-700">Error Loading Stripe Status</h3>
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (!stripeData.connected) {
    return (
      <div className="p-4 border rounded-md">
        <h3 className="text-lg font-semibold mb-2">Payment Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Stripe account to receive payments for your lessons.
        </p>
        <Button onClick={handleConnectStripe} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect with Stripe'}
        </Button>
      </div>
    );
  }

  return (
    <StripeAccountStatus
      accountId={stripeData.stripeAccountId}
      status={stripeData.status}
      isComplete={stripeData.isComplete}
      details={stripeData.details}
    />
  );
}
