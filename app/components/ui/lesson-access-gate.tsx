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
import { hasSuccessfulPurchaseParams, cleanPurchaseParams } from '@/app/utils/purchase-helpers';

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
  
  // Check if URL indicates a successful purchase - moved up to ensure hooks are called in the same order
  const isSuccess = hasSuccessfulPurchaseParams();
  
  // All hooks must be called unconditionally at the top level
  const [shouldRefresh] = useState(isSuccess && !hasAccess);
  
  // Force refresh if we have success parameters to ensure database is checked
  useEffect(() => {
    if (shouldRefresh) {
      // Set a small timeout to allow webhook to process
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldRefresh]);
  
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
  
  
  // If user has access or payment was just successful, show the content
  if (hasAccess || isSuccess) {
    // Remove the success parameters from the URL to prevent issues on refresh
    cleanPurchaseParams();
    
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
  
  // If user doesn't have access, check if they need to purchase
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
    
    // If we see success in URL but hasAccess is still false, show a processing message
    if (isSuccess) {
      return (
        <div className="p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Processing Your Purchase</h3>
          <p className="text-muted-foreground mb-4">
            Your payment was successful! We're processing your purchase and you'll have access momentarily.
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        {/* Show message if user already has access */}
        {hasAccess && (
          <div className="text-green-600 text-sm mb-2">
            You already have access to this lesson
          </div>
        )}
        <LessonCheckout 
          lessonId={lessonId}
          price={price}
          searchParams={new URLSearchParams(window.location.search)}
          onAccessLesson={() => window.location.reload()}
          hasAccess={hasAccess || isSuccess} // Pass both hasAccess and isSuccess
        />
      </div>
    );
  }
  
  return null;
}
