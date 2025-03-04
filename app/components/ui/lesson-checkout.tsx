'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/app/services/supabase';
import { useAuth } from '@/app/services/auth/AuthContext';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
  searchParams?: URLSearchParams;
  hasAccess?: boolean; // New prop to indicate if user already has access
}

export function LessonCheckout({ lessonId, price, searchParams, hasAccess = false }: LessonCheckoutProps) {
  const isSuccess = searchParams?.get('purchase') === 'success';
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If the user already has access, show an "Access Lesson" button instead
  if (hasAccess) {
    return (
      <Button 
        onClick={() => router.push(`/lessons/${lessonId}`)}
        variant="outline"
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Access Lesson
      </Button>
    );
  }

  // If purchase was successful, show success message
  if (isSuccess) {
    return (
      <div className="text-green-600 font-medium">
        Payment Successful
      </div>
    );
  }

  // If user is not authenticated, show sign-in button
  if (!user && !authLoading) {
    return (
      <Button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent opening preview
          window.location.href = `/auth?redirect=/lessons/${lessonId}`;
        }}
      >
        Sign in to Purchase
      </Button>
    );
  }

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

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      <Button 
        onClick={handleCheckout} 
        disabled={isLoading || authLoading}
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
