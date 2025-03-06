'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RequestGrid } from './request-grid';
import { RequestSidebar } from './request-sidebar';
import { Button } from '@/app/components/ui/button';
import { Menu } from 'lucide-react';

export function RequestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Extract query parameters
  const categoryParam = searchParams.get('category');
  const sortByParam = searchParams.get('sort') as 'popular' | 'newest' | undefined;
  
  // Set default sort if not provided
  const sortBy = sortByParam || 'popular';
  
  // Handle category selection
  const handleCategorySelect = (category?: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    
    router.push(`/requests?${params.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (sort: 'popular' | 'newest') => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    router.push(`/requests?${params.toString()}`);
  };
  
  // Handle error in request grid
  const handleError = (error: Error) => {
    console.error('Request grid error:', error);
    // Could add toast notification or other error handling here
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center mb-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-4">Lesson Requests</h1>
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold mb-6">Lesson Requests</h1>
          </div>
          <RequestSidebar
            selectedCategory={categoryParam || undefined}
            onSelectCategory={handleCategorySelect}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
        
        {/* Main content */}
        <div className="lg:w-3/4">
          <RequestGrid
            category={categoryParam || undefined}
            sortBy={sortBy}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}
