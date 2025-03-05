'use client';

import { Loader2, PencilIcon, CheckCircle, Calendar } from 'lucide-react';
import { useLessonAccess } from '@/app/hooks/use-lesson-access';
import { LessonCheckout } from './lesson-checkout';
import { cn } from '@/app/lib/utils';
import { formatDate } from '@/app/utils/format';
import { Badge } from './badge';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Button } from './button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface LessonAccessGateProps {
  lessonId: string;
  creatorId?: string;
  children: React.ReactNode;
  price?: number;
  className?: string;
}

export function LessonAccessGate({ 
  lessonId,
  creatorId,
  children,
  price,
  className
}: LessonAccessGateProps) {
  const { hasAccess, loading, error, purchaseStatus, purchaseDate } = useLessonAccess(lessonId);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Check if current user is the lesson creator
  const isOwner = creatorId && user?.id === creatorId;
  
  // If user is the owner, they always have access
  if (isOwner) {
    return (
      <div className={cn(className)}>
        {children}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => router.push(`/lessons/${lessonId}/edit`)}
            variant="outline"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Lesson
          </Button>
        </div>
      </div>
    );
  }
  
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 data-testid="loading-spinner" className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <p className="text-red-600 text-sm">
          {error.message || 'Failed to check access'}
        </p>
        {price !== undefined && (
          <div className="mt-4">
            <LessonCheckout 
              lessonId={lessonId}
              price={price}
              searchParams={new URLSearchParams(window.location.search)}
            />
          </div>
        )}
      </div>
    );
  }
  
  // Check URL parameters for purchase=success or session_id
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSuccess = urlParams?.get('purchase') === 'success' || 
                    urlParams?.has('session_id') || 
                    (typeof window !== 'undefined' && window.location.href.includes('session_id='));

  if (!hasAccess && price !== undefined) {
    // For free lessons, show an "Access Lesson" button for authenticated users
    if (price === 0 && user) {
      return (
        <div className="p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Free Lesson</h3>
          <p className="text-muted-foreground mb-4">
            This lesson is available for free
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Access Lesson
          </Button>
        </div>
      );
    }
    
    // If we see success in URL but hasAccess is still false, show a check status button
    if (isSuccess) {
      const [isChecking, setIsChecking] = useState(false);
      const [checkCount, setCheckCount] = useState(0);
      
      // Auto-check status on first load
      useEffect(() => {
        if (isSuccess && !hasAccess) {
          handleCheckStatus();
        }
      }, []);
      
      const handleCheckStatus = async () => {
        try {
          setIsChecking(true);
          setCheckCount(prev => prev + 1);
          
          const response = await fetch('/api/lessons/check-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lessonId })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.hasAccess) {
              window.location.reload();
            } else if (checkCount >= 3) {
              // After 3 attempts, offer to force access
              const forceAccess = confirm(
                'Your payment was successful, but we\'re having trouble confirming it. ' +
                'Would you like to access the content anyway? ' +
                'Your purchase will be verified in the background.'
              );
              
              if (forceAccess) {
                // Remove the success parameter from the URL to prevent issues on refresh
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('purchase');
                  url.searchParams.set('force_access', 'true');
                  window.location.href = url.toString();
                }
              }
            } else {
              // Less than 3 attempts, just show a message
              alert('Your purchase is still being processed. Please try again in a moment.');
            }
          }
        } catch (err) {
          console.error('Error checking purchase status:', err);
        } finally {
          setIsChecking(false);
        }
      };
      
      const handleManualUpdate = async () => {
        try {
          setIsChecking(true);
          
          // Get the session ID and payment intent ID from URL if available
          const url = new URL(window.location.href);
          const sessionId = url.searchParams.get('session_id');
          const paymentIntentId = url.searchParams.get('payment_intent');
          
          const response = await fetch('/api/lessons/update-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              lessonId,
              sessionId,
              paymentIntentId
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              window.location.reload();
            } else {
              alert('Failed to update purchase: ' + (data.error || 'Unknown error'));
            }
          } else {
            alert('Failed to update purchase. Please try again.');
          }
        } catch (err) {
          console.error('Error manually updating purchase:', err);
          alert('An error occurred while updating your purchase.');
        } finally {
          setIsChecking(false);
        }
      };
      
      return (
        <div className="p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processing Your Purchase</h3>
          <p className="text-muted-foreground mb-4">
            Your payment was successful, but we're still processing your purchase. This usually takes just a few seconds.
          </p>
          <div className="space-y-2">
            <Button onClick={handleCheckStatus} disabled={isChecking} className="w-full">
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Purchase Status'
              )}
            </Button>
            
            <Button 
              onClick={handleManualUpdate} 
              variant="outline" 
              className="w-full"
              disabled={isChecking}
            >
              Manual Update
            </Button>
          </div>
        </div>
      );
    }
    
    // If no success parameter and no access, show purchase button
    return (
      <div className="p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Purchase Required</h3>
        <p className="text-muted-foreground mb-4">
          Purchase this lesson to get full access to the content
        </p>
        <LessonCheckout 
          lessonId={lessonId}
          price={price}
          searchParams={new URLSearchParams(window.location.search)}
          onAccessLesson={() => window.location.reload()}
          hasAccess={isSuccess} // Pass isSuccess as hasAccess to show Access button
        />
      </div>
    );
  }
  
  
  // Check for success URL parameter or session_id which indicates a completed purchase
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSuccess = urlParams?.get('purchase') === 'success' || urlParams?.has('session_id') || 
                    (typeof window !== 'undefined' && window.location.href.includes('session_id='));
  
  // If payment was just successful or user has access, show the content
  if (hasAccess || isSuccess) {
    // Remove the success parameter from the URL to prevent issues on refresh
    if (typeof window !== 'undefined' && urlParams?.has('purchase')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      window.history.replaceState({}, '', url.toString());
    }
    
    return (
      <div className={cn(className)}>
        {children}
        {isSuccess && (
          <div className="mt-4 text-sm text-green-600 font-medium">
            Payment Successful! You now have access to this lesson.
          </div>
        )}
        {purchaseStatus === 'completed' && purchaseDate && !isSuccess && (
          <div className="mt-4 flex items-center justify-center">
            <Badge variant="outline" className="px-3 py-1.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>You purchased this lesson on</span>
              <span className="font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(purchaseDate)}
              </span>
            </Badge>
          </div>
        )}
      </div>
    );
  }
  
  // If user doesn't have access, continue with the existing logic
  return null;
}
