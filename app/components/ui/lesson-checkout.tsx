'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/app/services/supabase';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
  searchParams?: URLSearchParams;
}

export function LessonCheckout({ lessonId, price, searchParams }: LessonCheckoutProps) {
  const router = useRouter();
  const isSuccess = searchParams?.get('purchase') === 'success';
  const sessionId = searchParams?.get('session_id');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Please sign in to purchase this lesson');
        return;
      }

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Use the new API endpoint for the merchant of record model
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          lessonId,
          price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.');
          return;
        }
        
        if (response.status === 403) {
          setError('You already own this lesson.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      const { error: redirectError } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      });

      if (redirectError) {
        throw redirectError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during checkout');
      console.error('Checkout error:', err);
    } finally {
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
      <Button 
        onClick={handleCheckout} 
        disabled={isLoading}
        className="w-full"
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
          `Purchase for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)}`
        )}
      </Button>
    </div>
  );
}
