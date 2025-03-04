'use client';

import { Loader2, PencilIcon } from 'lucide-react';
import { useLessonAccess } from '@/app/hooks/use-lesson-access';
import { LessonCheckout } from './lesson-checkout';
import { cn } from '@/app/lib/utils';
import { useAuth } from '@/app/services/auth/AuthContext';
import { Button } from './button';
import { useRouter } from 'next/navigation';

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
  
  if (!hasAccess && price !== undefined) {
    // Check URL parameters for purchase=success
    const isSuccess = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).get('purchase') === 'success';
    
    // If we see success in URL but hasAccess is still false, show a check status button
    if (isSuccess) {
      const handleCheckStatus = async () => {
        try {
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
            } else {
              alert('Your purchase is still being processed. Please try again in a moment.');
            }
          }
        } catch (err) {
          console.error('Error checking purchase status:', err);
        }
      };
      
      return (
        <div className="p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processing Your Purchase</h3>
          <p className="text-muted-foreground mb-4">
            Your payment was successful, but we're still processing your purchase. This usually takes just a few seconds.
          </p>
          <Button onClick={handleCheckStatus}>
            Check Purchase Status
          </Button>
        </div>
      );
    }
    
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
        />
      </div>
    );
  }
  
  // Check for success URL parameter
  const isSuccess = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('purchase') === 'success';
  
  // If payment was just successful, show success message and content
  if (isSuccess) {
    // Remove the success parameter from the URL to prevent issues on refresh
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      window.history.replaceState({}, '', url.toString());
    }
    
    // Override hasAccess for success parameter
    return (
      <div className={cn(className)}>
        {children}
        <div className="mt-4 text-sm text-green-600 font-medium">
          Payment Successful! You now have access to this lesson.
        </div>
      </div>
    );
  }
  
  // If user has access, show the content with purchase info if available
  return (
    <div className={cn(className)}>
      {children}
      {purchaseStatus === 'completed' && purchaseDate && (
        <div className="mt-4 text-sm text-green-600">
          You purchased this lesson on {new Date(purchaseDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
