import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PurchaseLessonParams {
  lessonId: string;
  price: number;
}

interface CheckPurchaseParams {
  lessonId: string;
  sessionId?: string;
  retryCount?: number;
}

export function usePurchaseLesson() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  const purchaseLesson = useCallback(async ({ lessonId, price }: PurchaseLessonParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Initiating purchase for lesson:', lessonId);
      
      const response = await fetch('/api/lessons/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId, price }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate purchase');
      }
      
      console.log('Purchase initiated, redirecting to Stripe:', data.sessionId);
      
      // Redirect to Stripe Checkout
      window.location.assign(`https://checkout.stripe.com/pay/${data.sessionId}`);
      
      return data;
    } catch (err) {
      console.error('Error purchasing lesson:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPurchaseStatus = useCallback(async ({ 
    lessonId, 
    sessionId,
    retryCount = 0
  }: CheckPurchaseParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Checking purchase status for lesson:', lessonId);
      
      const response = await fetch('/api/lessons/check-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId, sessionId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check purchase status');
      }
      
      console.log('Purchase status:', data);
      
      setHasAccess(data.hasAccess);
      setPurchaseStatus(data.purchaseStatus);
      
      // If we don't have access yet but have retries left, try again after a delay
      if (!data.hasAccess && retryCount > 0) {
        console.log(`No access yet, retrying in 2 seconds (${retryCount} retries left)`);
        setTimeout(() => {
          checkPurchaseStatus({
            lessonId,
            sessionId,
            retryCount: retryCount - 1
          });
        }, 2000);
      } else if (data.hasAccess) {
        // If we have access, refresh the page to show the content
        router.refresh();
      }
      
      return data;
    } catch (err) {
      console.error('Error checking purchase status:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    purchaseLesson,
    checkPurchaseStatus,
    isLoading,
    error,
    hasAccess,
    purchaseStatus,
  };
}
