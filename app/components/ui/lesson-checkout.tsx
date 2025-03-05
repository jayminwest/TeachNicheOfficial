'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/app/services/supabase';
import { useAuth } from '@/app/services/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface LessonCheckoutProps {
  lessonId: string;
  price: number;
  searchParams?: URLSearchParams;
  hasAccess?: boolean; // New prop to indicate if user already has access
  onAccessLesson?: () => void; // Callback for when "Access Lesson" button is clicked
}

export function LessonCheckout({ lessonId, price, searchParams, hasAccess = false, onAccessLesson }: LessonCheckoutProps) {
  const isSuccess = searchParams?.get('purchase') === 'success';
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Mark initial load as complete after auth check
  useEffect(() => {
    if (!authLoading) {
      setInitialLoadComplete(true);
    }
  }, [authLoading]);

  // Show loading state before initial auth check completes
  if (authLoading || !initialLoadComplete) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking auth...
      </Button>
    );
  }

  // If the user already has access or purchase was successful, show an "Access Lesson" button
  if (hasAccess || isSuccess) {
    return (
      <Button 
        onClick={onAccessLesson || (() => router.push(`/lessons/${lessonId}`))}
        variant="outline"
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Access Lesson
      </Button>
    );
  }

  // If user is not authenticated and not loading, show sign-in button
  if (!isAuthenticated && !authLoading) {
    return (
      <Button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent opening preview
          router.push(`/auth/signin?redirect=/lessons/${lessonId}`);
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

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Store the session ID for potential manual updates
      localStorage.setItem(`stripe-session-${lessonId}`, data.sessionId);
      
      console.log('Redirecting to Stripe checkout with session ID:', data.sessionId);
      
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Purchase Lesson'
        )}
      </Button>
    </div>
  );
}
