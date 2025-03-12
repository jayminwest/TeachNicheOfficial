'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface StripeAccountStatusProps {
  accountId?: string;
  status?: string;
  isComplete?: boolean;
  details?: {
    pendingVerification?: boolean;
    missingRequirements?: string[];
  };
  className?: string;
}

export function StripeAccountStatus({
  accountId,
  status = 'unknown',
  isComplete = false,
  details,
  className = '',
}: StripeAccountStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusData, setStatusData] = useState({
    status,
    isComplete,
    details
  });

  const refreshStatus = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      console.log('Refreshing Stripe account status...');
      
      const response = await fetch('/api/stripe/connect/refresh-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting parameter
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to refresh status:', errorText);
        throw new Error(`Failed to refresh status: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Refresh status response:', data);
      
      if (data.success && data.status) {
        console.log('Updating component state with new status data');
        setStatusData({
          status: data.status.status,
          isComplete: data.status.isComplete,
          details: data.status.details
        });
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error refreshing Stripe status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    const currentStatus = statusData.status;
    const currentIsComplete = statusData.isComplete;
    
    if (currentIsComplete) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </span>
      );
    }
    
    if (currentStatus === 'verification_pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Verification Pending
        </span>
      );
    }
    
    if (currentStatus === 'requirements_needed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Requirements Needed
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Setup Incomplete
      </span>
    );
  };

  return (
    <div className={`p-4 border rounded-md ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Stripe Account Status</h3>
        {getStatusBadge()}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {statusData.isComplete 
          ? 'Your Stripe account is fully set up and ready to receive payments.'
          : 'Your Stripe account setup is incomplete. Please complete the required steps.'}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded-md flex items-center ${statusData.isComplete ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`mr-3 ${statusData.isComplete ? 'text-green-500' : 'text-red-500'}`}>
            {statusData.isComplete ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">Account Details</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-md flex items-center ${statusData.isComplete ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`mr-3 ${statusData.isComplete ? 'text-green-500' : 'text-red-500'}`}>
            {statusData.isComplete ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">Payment Processing</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-md flex items-center ${statusData.isComplete ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`mr-3 ${statusData.isComplete ? 'text-green-500' : 'text-red-500'}`}>
            {statusData.isComplete ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">Payouts Enabled</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-md flex items-center ${
          statusData.details?.pendingVerification 
            ? 'bg-yellow-50' 
            : (statusData.isComplete ? 'bg-green-50' : 'bg-gray-50')
        }`}>
          <div className={`mr-3 ${
            statusData.details?.pendingVerification 
              ? 'text-yellow-500' 
              : (statusData.isComplete ? 'text-green-500' : 'text-gray-500')
          }`}>
            {statusData.details?.pendingVerification 
              ? <AlertCircle className="h-5 w-5" /> 
              : (statusData.isComplete ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />)}
          </div>
          <div>
            <p className="text-sm font-medium">Verification Status</p>
          </div>
        </div>
      </div>
      
      {accountId && (
        <div className="text-xs text-muted-foreground mb-4">
          Account ID: {accountId}
        </div>
      )}
      
      {statusData.details?.missingRequirements && statusData.details.missingRequirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Missing Requirements:</h4>
          <ul className="text-xs text-muted-foreground list-disc pl-5">
            {statusData.details.missingRequirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStatus}
          disabled={isRefreshing}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </div>
    </div>
  );
}
