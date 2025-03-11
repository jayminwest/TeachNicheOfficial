'use client';

import { useSearchParams } from 'next/navigation';
import NewLessonForm from './new-lesson-form';
import { ErrorBoundary } from '@/app/components/ui/error-boundary';

export default function NewLessonClient() {
  // This component safely uses useSearchParams() within a SearchParamsWrapper
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  
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
      <NewLessonForm redirectPath={redirect || undefined} />
    </ErrorBoundary>
  );
}
