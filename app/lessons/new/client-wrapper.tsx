'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SearchParamsWrapper } from '@/app/components/ui/search-params-wrapper';
import NewLessonClient from './client';

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
    <SearchParamsWrapper 
      fallback={
        <div className="space-y-6">
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        </div>
      }
    >
      <NewLessonClient />
    </SearchParamsWrapper>
  );
}
