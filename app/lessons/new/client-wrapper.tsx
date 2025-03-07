'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import NewLessonForm from './new-lesson-form';

export default function NewLessonClientWrapper() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Return loading state on server or during initial client render
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Form Error</h3>
          <p>There was a problem with the lesson creation form.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <NewLessonForm />
    </ErrorBoundary>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';
import NewLessonForm from './new-lesson-form';

export default function NewLessonClientWrapper() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Return loading state on server or during initial client render
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold">Form Error</h3>
          <p>There was a problem with the lesson creation form.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <NewLessonForm />
    </ErrorBoundary>
  );
}
