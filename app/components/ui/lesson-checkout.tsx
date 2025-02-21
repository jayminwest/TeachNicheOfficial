'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
  searchParams?: URLSearchParams;
}

export function LessonCheckout({ lessonId, price, searchParams }: LessonCheckoutProps) {
  const isSuccess = searchParams?.get('purchase') === 'success';

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  
  const handleCheckout = async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!user) {
        setError('Please sign in to purchase this lesson');
        return;
      }

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const response = await fetch('/api/lessons/purchase', {
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
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { error } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-green-600 font-medium">
        Payment Successful
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      <Button 
        onClick={handleCheckout} 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="mr-2">Processing...</span>
            <span className="animate-spin">⚪</span>
          </>
        ) : (
          'Purchase Lesson'
        )}
      </Button>
    </div>
  );
}
