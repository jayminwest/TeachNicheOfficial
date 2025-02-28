'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { calculateFees, formatPrice, PAYMENT_CONSTANTS } from '@/app/lib/constants';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
  searchParams?: { get(key: string): string | null };
}

export function LessonCheckout({ lessonId, price, searchParams }: LessonCheckoutProps) {
  const router = useRouter();
  const isSuccess = searchParams?.get('purchase') === 'success';
  // Session ID is available from URL if needed later

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  
  // Calculate fees using the utility function
  const { lessonPrice, stripeFee, totalBuyerCost } = calculateFees(price / 100); // Convert cents back to dollars for display

  const handleCheckout = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Check auth status
      const { data: { session } } = await new Promise(resolve => {
        // Dynamically import Firebase auth to avoid SSR issues
        import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
          import('firebase/app').then(({ getApp }) => {
            const auth = getAuth(getApp());
            const unsubscribe = onAuthStateChanged(auth, user => {
              unsubscribe();
              resolve({ data: { session: user ? { user } : null }, error: null });
            });
          }).catch(error => {
            console.error('Error importing Firebase app:', error);
            resolve({ data: { session: null }, error: null });
          });
        }).catch(error => {
          console.error('Error importing Firebase auth:', error);
          resolve({ data: { session: null }, error: null });
        });
      });
      
      if (!session) {
        setError('Please sign in to purchase this lesson');
        return;
      }

      // Validate price is positive and reasonable
      if (totalBuyerCost <= 0 || totalBuyerCost > 10000) {
        setError('Invalid price amount');
        return;
      }

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Use the API endpoint for the merchant of record model
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          lessonId,
          price: Math.round(totalBuyerCost * 100), // Convert dollars back to cents for Stripe
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Log detailed error information for debugging
        console.error('Checkout API error:', {
          status: response.status,
          errorData,
          lessonId
        });
        
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.');
          return;
        }
        
        if (response.status === 403) {
          setError('You already own this lesson.');
          return;
        }
        
        // Handle specific error for purchase record creation
        if (errorData.code === 'purchase_record_failed' || 
            errorData.error?.includes('purchase record')) {
          setError('Unable to create purchase record. Please try again later.');
          return;
        }
        
        // More descriptive general error
        throw new Error(errorData.error || errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      const { error: redirectError } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      });

      if (redirectError) {
        throw redirectError;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      
      // Implement retry logic for network errors
      if ((err instanceof Error && 
          (err.message.includes('network') || err.message.includes('connection'))) && 
          retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Wait a bit before retrying
        setTimeout(() => {
          setIsLoading(false);
          handleCheckout();
        }, 1000);
        return;
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred during checkout');
    } finally {
      if (retryCount === MAX_RETRIES) {
        // Reset retry count after max retries
        setRetryCount(0);
      }
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <div className="text-green-600 font-medium mb-2">Payment Successful!</div>
        <p className="text-sm text-gray-600">
          Thank you for your purchase. You now have full access to this lesson.
        </p>
        <Button 
          variant="outline" 
          className="mt-3"
          onClick={() => router.push(`/lessons/${lessonId}`)}
        >
          Continue to Lesson
        </Button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm mb-3">
          {error}
        </div>
      )}
      
      {/* Fee breakdown */}
      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <div className="flex justify-between text-sm mb-1">
          <span>Lesson price:</span>
          <span>{formatPrice(lessonPrice)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Processing fee:</span>
          <span>{formatPrice(stripeFee)}</span>
        </div>
        <div className="flex justify-between font-medium border-t border-border pt-2">
          <span>Total:</span>
          <span>{formatPrice(totalBuyerCost)}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <span>{PAYMENT_CONSTANTS.CREATOR_SHARE_PERCENTAGE * 100}% of the lesson price goes directly to the creator.</span>
        </div>
      </div>
      
      <Button 
        onClick={handleCheckout} 
        disabled={isLoading}
        className="w-full"
        data-testid="purchase-button"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Purchase for ${formatPrice(totalBuyerCost)}`
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center mt-3">
        Secure payment processed by Teach Niche. By purchasing, you agree to our Terms of Service.
      </p>
    </div>
  );
}
