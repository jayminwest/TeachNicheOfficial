'use client';

import { Loader2 } from 'lucide-react';
import { useLessonAccess } from '@/app/hooks/use-lesson-access';
import { LessonCheckout } from './lesson-checkout';
import { cn } from '@/app/lib/utils';
import { useAuth } from '@/app/services/auth/AuthContext';

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
  const { hasAccess, loading, error } = useLessonAccess(lessonId);
  const { user } = useAuth();
  
  // Check if current user is the lesson creator
  const isOwner = user?.id === creatorId;
  
  // If user is the owner, they always have access
  if (isOwner) {
    return <div className={cn(className)}>{children}</div>;
  }
  const { user } = useAuth();
  
  // Check if current user is the lesson creator
  const isOwner = user?.id === creatorId;
  
  // If user is the owner, they always have access
  if (isOwner) {
    return <div className={cn(className)}>{children}</div>;
  }
  
  if (loading) {
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
      </div>
    );
  }
  
  if (!hasAccess && price !== undefined) {
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
  
  return <div className={cn(className)}>{children}</div>;
}
